import type { PartialRecord } from '~/types';

export const colorsList = {
    lightgray0: '#F7F7FA',
    lightgray50: '#F2F2F7',
    lightgray100: '#EDEDF2',
    lightgray125: '#E6E6EB',
    lightgray150: '#DEDEE7',
    lightgray200: '#D5D5E4',
    lightgray300: '#bfbfc2',
    lightgray400: '#aaaaac',

    darkgray1000: '#131316',
    darkgray950: '#18181B',
    darkgray900: '#202024',
    darkgray875: '#26262C',
    darkgray850: '#2B2B33',
    darkgray800: '#30303C',
    darkgray700: '#3c3c3f',
    darkgray600: '#525255',

    primary700: '#512da8',
    primary600: '#6743b2',
    primary500: '#7c59bc',
    primary400: '#8f70c6',
    primary300: '#a287d0',

    success700: '#46a92d',
    success600: '#57b143',
    success500: '#66bb58',
    success400: '#7dc671',
    success300: '#90d086',

    warning700: '#a9902d',
    warning600: '#b19d43',
    warning500: '#bbad58',
    warning400: '#c6bb71',
    warning300: '#d0c686',

    error700: '#a92d46',
    error600: '#b14357',
    error500: '#bb5866',
    error400: '#c6717d',
    error300: '#d08690',

    info700: '#2da990',
    info600: '#43b19d',
    info500: '#58bbad',
    info400: '#71c6bb',
    info300: '#86d0c6',
};

export type ColorsList = keyof typeof colorsList;

export const themesList = {
    light: {
        darkgray1000: '#F7F7FA',
        darkgray950: '#F2F2F7',
        darkgray900: '#EDEDF2',
        darkgray875: '#E6E6EB',
        darkgray850: '#DEDEE7',
        darkgray800: '#D5D5E4',
        darkgray700: '#bfbfc2',
        darkgray600: '#aaaaac',

        lightgray0: '#131316',
        lightgray50: '#18181B',
        lightgray100: '#202024',
        lightgray125: '#26262C',
        lightgray150: '#2B2B33',
        lightgray200: '#30303C',
        lightgray300: '#3c3c3f',
        lightgray400: '#525255',
    },
} satisfies Record<string, PartialRecord<ColorsList, string>>;

export type ThemesList = keyof typeof themesList | 'default';
