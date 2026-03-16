import { ref,watch } from "vue";
import type { SwitchRef, CreateSwitchConfig, SwitchWatchFn } from "./Type";

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
    initialStatus: Record<string, boolean> = {};
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
                const opened = initOpenMap[id] || false;
                this.switchMap[id] = createSwitch({id,name:id,data: {},initOpened:opened});
                this.initialStatus[id] = opened;
            }
        });
        
    };
    addSwitch({ id, name, initOpened = false, data = {} }:CreateSwitchConfig):SwitchRef {
        if (this.switchMap[id]) {
            throw new Error(`开关 ${id} 已存在`);
        }
        const switchRef = createSwitch({ id, name, data, initOpened });
        this.switchMap[id] = switchRef;
        this.initialStatus[id] = initOpened;
        return switchRef;
    };
    addSwitchWatch(id:string,watchFn:SwitchWatchFn,immediate:boolean = false):void {
        let switchRef = this.getSwitchById(id);
        if(switchRef){
            switchRef.listen.add(watchFn);
        }
        if(immediate){
            watchFn(switchRef.value,undefined,switchRef.data);
        }
    };
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
    openByIds(ids:string[]):void {
        ids.forEach(id => this.openSwitchById(id));
    };
    closeSwitchById(id:string):void {
        let switchRef = this.getSwitchById(id);
        if(switchRef){
            switchRef.value = false;
        }
    };
    closeByIds(ids:string[]):void {
        ids.forEach(id => this.closeSwitchById(id));
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
        delete this.initialStatus[id];
    };
    reset():void {
        Object.keys(this.switchMap).forEach(id => {
            this.switchMap[id].value = this.initialStatus[id] ?? false;
        });
    };
}

const master = new SwitchMasterVue();

export default master;