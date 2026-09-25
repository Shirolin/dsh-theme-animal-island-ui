import type { ComponentType } from 'react';
import type { TokenPairs } from '../types.ts';
export interface ThemeRuntimeLike {
    overrideTokens(source: string, tokens: TokenPairs): () => void;
}
export interface SlotRegistrationOptions {
    name: string;
    locale?: string;
    priority?: number;
    children?: Readonly<Record<string, {
        kind: 'single' | 'list' | 'keyed' | 'chain';
        scope: 'root' | 'session' | 'session-maybe';
        inject?: object;
    }>>;
    inject?: (...args: never[]) => object;
}
export interface SlotSpecLike {
    kind: string;
    scope: string;
}
export interface SlotRegistryLike {
    inject(key: string, callback: () => (() => void) | Iterable<() => void>): () => void;
    register<P extends object>(options: SlotRegistrationOptions, component: ComponentType<P>): () => void;
    spec(key: string): SlotSpecLike | undefined;
}
export interface ClientContextLike {
    theme?: ThemeRuntimeLike;
    slots?: SlotRegistryLike;
    effect(effect: () => void | (() => void), name?: string): unknown;
}
