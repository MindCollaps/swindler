declare module 'handlebars' {
    interface HandlebarsModule {
        compile<TContext extends Record<string, unknown>>(template: string): (context: TContext) => string;
    }

    const Handlebars: HandlebarsModule;
    export default Handlebars;
}

declare module 'nodemailer' {
    export interface Transporter {
        sendMail(options: {
            from?: string;
            to: string;
            subject: string;
            html: string;
        }): Promise<unknown>;
    }

    const nodemailer: {
        createTransport(options: {
            host?: string;
            port?: number;
            secure?: boolean;
            auth?: {
                user?: string;
                pass?: string;
            };
        }): Transporter;
    };

    export default nodemailer;
}
