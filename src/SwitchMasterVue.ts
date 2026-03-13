import { ref,watch,onMounted,onUnmounted } from "vue";
import type { Ref } from "vue";
interface CreateSwitchConfig {
    id: string;
    name?: string;
    data?: Record<string, any>;
    initOpened?: boolean;
}

type SwitchWatchFn = (newVal?: boolean, oldVal?: boolean,data?: Record<string, any>) => void;

interface SwitchRef extends Ref<boolean> {
    id: string;
    name: string;
    data: Record<string, any>;
    listen: Set<SwitchWatchFn>;
    stopWatch: () => void;
}

const createSwitch = ({id,name,data = {},initOpened = false}:CreateSwitchConfig):SwitchRef => {
    const statusRef:SwitchRef = ref(initOpened) as SwitchRef;
    statusRef.id = id;
    statusRef.name = name || id;
    statusRef.data = data;
    statusRef.listen = new Set();
    const stopWatch = watch(() => statusRef.value, (newVal, oldVal) => {
        statusRef.listen.forEach(Fn => {
            if(typeof Fn === 'function'){
                Fn(newVal,oldVal,statusRef.data);
            }
        })
    });
    statusRef.stopWatch = stopWatch;
    return statusRef;
}

class SwitchMasterVue {
    switchMap: Record<string, SwitchRef> = {};
    constructor(switchIds: string[] = [], initOpenedSwitchs:string[] = []) {
        this.createSwitchs(switchIds, initOpenedSwitchs);
    };
    createSwitchs(switchIds: string[] = [], initOpenedSwitchs:string[] = []):void{
        const initOpenMap: Record<string, boolean> = {};
        initOpenedSwitchs.forEach(id => {
            if (!switchIds.includes(id)) {
                console.warn(`你创建开关时默认打开的开关组中， ${id} 并不在这一批的创建中，将被忽略`);
            }
            initOpenMap[id] = true;
        })
        switchIds.forEach((id,index) => {
            if(this.switchMap.hasOwnProperty(id)) {
                throw new Error(`开关 ${id} 已存在，请保证id唯一。第 ${index + 1} 个开关创建失败`);
            }else{
                this.switchMap[id] = createSwitch({id,name:id,data: {},initOpened:initOpenMap[id] || false});
            }
        });
        
    };
    addSwitch({ id, name, initOpened = false, data = {} }:CreateSwitchConfig):SwitchRef {
        if (this.switchMap[id]) {
            throw new Error(`开关 ${id} 已存在`);
        }
        const switchRef = createSwitch({ id, name, data, initOpened });
        this.switchMap[id] = switchRef;
        return switchRef;
    }
    getSwitchById(id:string):SwitchRef {
        if(!this.switchMap.hasOwnProperty(id)){
            throw new Error(`开关 ${id} 不存在`);
        }
        return this.switchMap[id];
    };
    openSwitchById(id:string):void {
        let switchRef = this.getSwitchById(id);
        if(switchRef){
            switchRef.value = true;
        }
    };
    closeSwitchById(id:string):void {
        let switchRef = this.getSwitchById(id);
        if(switchRef){
            switchRef.value = false;
        }
    };
    toggleSwitchById(id:string):void {
        let switchRef = this.getSwitchById(id);
        if(switchRef){
            switchRef.value = !switchRef.value;
        }
    };
    deleteSwitchById(id:string):void {
        if(!this.switchMap.hasOwnProperty(id)){
            throw new Error(`开关 ${id} 不存在`);
        }
        let switchRef = this.switchMap[id];
        if(switchRef?.stopWatch) switchRef.stopWatch();
        delete this.switchMap[id];
    };
}

const master = new SwitchMasterVue();

const useSwitch = (id:string):SwitchRef => {
    return master.getSwitchById(id);
}

const useSwitchWatch = (id:string, watchFn:SwitchWatchFn, immediate:boolean = false):void => {
    const switchRef = master.getSwitchById(id);
    onMounted(() => {
        switchRef.listen.add(watchFn);
        if(immediate){
            watchFn(switchRef.value,undefined,switchRef.data);
        }
    })
    onUnmounted(() => {
        switchRef.listen.delete(watchFn);
    })
}


const useToggle = (switchIds: string[] = []):(id:string)=>void => {
    const switchRefMap: Record<string, SwitchRef> = {};
    switchIds.forEach((id) => {
        const sw = master.getSwitchById(id);
        if (!sw) {
          throw new Error(`开关 ${id} 不存在`);
        }
        switchRefMap[id] = sw;
    });
    const toggleFn = (id:string):void => {
        if(!switchRefMap.hasOwnProperty(id)){
            throw new Error(`useToggle中没有找到开关 ${id}，请检查useToggle的入参中是否存在要单选的开关`);
        }
        Object.keys(switchRefMap).forEach(key => {
            if(key === id){
                let s = switchRefMap[key];
                if(s.value){
                    s.value = false;
                }else{
                    s.value = true;
                }
            }else{
                switchRefMap[key].value = false;
            }
        })
    };
    return toggleFn;
}

export default master;
export { useSwitch, useToggle ,useSwitchWatch};
export type { SwitchRef, SwitchWatchFn, CreateSwitchConfig };