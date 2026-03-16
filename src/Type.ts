import type { Ref } from 'vue';
type SwitchWatchFn = (newVal?: boolean, oldVal?: boolean,data?: Record<string, any>) => void;

interface CreateSwitchConfig {
    id: string;
    name?: string;
    data?: Record<string, any>;
    initOpened?: boolean;
}

interface SwitchRef extends Ref<boolean> {
    id: string;
    name: string;
    data: Record<string, any>;
    listen: Set<SwitchWatchFn>;
    stopWatch: () => void;
}


export type { SwitchRef, SwitchWatchFn, CreateSwitchConfig };