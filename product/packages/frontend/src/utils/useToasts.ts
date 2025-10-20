import { reactive } from 'vue';
export type Toast = { id: number; kind: 'success' | 'error'; text: string };

const state = reactive({ list: [] as Toast[] });
let seq = 1;

export function useToasts() {
  const push = (t: Omit<Toast, 'id'>) => {
    const item = { id: seq++, ...t };
    state.list.push(item);
    setTimeout(() => {
      const i = state.list.findIndex((x) => x.id === item.id);
      if (i >= 0) state.list.splice(i, 1);
    }, 4000);
  };
  return { list: state.list, push };
}
