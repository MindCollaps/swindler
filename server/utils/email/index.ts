import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type EmailTemplateName = 'account-created' | 'password-reset' | 'password-reset-success';

interface SendTemplatedEmailOptions {
    to: string;
    subject: string;
    template: EmailTemplateName;
    context: Record<string, unknown>;
}

type CompiledTemplate = (context: Record<string, unknown>) => string;

const templateCache = new Map<EmailTemplateName, CompiledTemplate>();

let transporter: Transporter | null = null;

function getAppBaseUrl() {
    return (process.env.APP_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
}

function getSmtpPort() {
    const rawPort = process.env.SMTP_PORT || '587';
    const parsed = parseInt(rawPort, 10);
    return Number.isNaN(parsed) ? 587 : parsed;
}

function isSmtpSecure() {
    return process.env.SMTP_SECURE === 'true';
}

function canSendEmails() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_FROM,
    );
}

function shouldLogEmailsToConsole() {
    return process.env.EMAIL_LOG_TO_CONSOLE === 'true' || process.env.EMAIL_LOG_ONLY === 'true';
}

function shouldLogOnlyEmails() {
    return process.env.EMAIL_LOG_ONLY === 'true';
}

function getTransporter() {
    if (transporter) {
        return transporter;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: getSmtpPort(),
        secure: isSmtpSecure(),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter;
}

async function renderTemplate(template: EmailTemplateName, context: Record<string, unknown>) {
    const existingTemplate = templateCache.get(template);

    if (existingTemplate) {
        return existingTemplate(context);
    }

    const templatePath = join(process.cwd(), 'server', 'emails', 'templates', `${ template }.hbs`);
    const source = await readFile(templatePath, 'utf8');
    const compiledTemplate = Handlebars.compile<Record<string, unknown>>(source);

    templateCache.set(template, compiledTemplate);

    return compiledTemplate(context);
}

export function buildPasswordResetUrl(token: string) {
    return `${ getAppBaseUrl() }/reset-password?token=${ encodeURIComponent(token) }`;
}

export function buildEmailVerificationUrl(token: string) {
    return `${ getAppBaseUrl() }/api/v1/auth/email/verify?token=${ encodeURIComponent(token) }`;
}

export async function sendTemplatedEmail(options: SendTemplatedEmailOptions) {
    try {
        const html = await renderTemplate(options.template, {
            ...options.context,
            appBaseUrl: getAppBaseUrl(),
        });

        if (shouldLogEmailsToConsole()) {
            console.log('[Email] Rendered email payload', {
                to: options.to,
                subject: options.subject,
                template: options.template,
                html,
            });
        }

        if (shouldLogOnlyEmails()) {
            return true;
        }

        if (!canSendEmails()) {
            console.warn(`[Email] Skipping email "${ options.subject }" to ${ options.to } because SMTP is not configured.`);
            return false;
        }

        await getTransporter().sendMail({
            from: process.env.SMTP_FROM,
            to: options.to,
            subject: options.subject,
            html,
        });

        return true;
    }
    catch (error) {
        console.error(`[Email] Failed to send "${ options.subject }" to ${ options.to }`, error);
        return false;
    }
}
