import { ref } from 'vue';

import { message } from 'ant-design-vue';
import Cookies from 'js-cookie';

const SOUND_COOKIE = 'isPlaySound';

const playSound = ref(Cookies.get(SOUND_COOKIE) !== '2');

export function useHeaderAlertSound() {
  function toggleSound() {
    playSound.value = !playSound.value;
    Cookies.set(SOUND_COOKIE, playSound.value ? '1' : '2');
    message.success(playSound.value ? '语音播放开启成功' : '语音播放关闭成功');
  }

  return {
    playSound,
    toggleSound,
  };
}
