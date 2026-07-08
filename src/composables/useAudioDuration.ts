// composables/useAudioDuration.ts
import { ref } from 'vue';

export function useAudioDuration(url: string) {
  const duration = ref('00:00');

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.src = url;
  audio.addEventListener('loadedmetadata', () => {
    const mins = Math.floor(audio.duration / 60);
    const secs = Math.floor(audio.duration % 60);
    duration.value = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    audio.src = '';
  });

  return duration;
}