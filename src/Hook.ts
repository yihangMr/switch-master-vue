import { onMounted, onUnmounted } from 'vue';
import type { SwitchRef, SwitchWatchFn } from "./Type";
import master from "./SwitchMasterVue";

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

export { useSwitch, useToggle ,useSwitchWatch};