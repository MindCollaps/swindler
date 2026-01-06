<template>
  <div class="avatar-creator">
    <div class="setting lower">
      <chevron @click="change('hair', false)" />
      <chevron @click="change('face', false)" />
      <chevron @click="change('body', false)" />
      <chevron @click="change('clothing', false)" />
      
    </div>
    <div class="avatar-show">
      <avatar-model size-x="200px" size-y="200px" :avatar="avatar" />
    </div>
    <div class="setting upper">
      <chevron right @click="change('hair', true)" />
      <chevron right @click="change('face', true)" />
      <chevron right @click="change('body', true)" />
      <chevron right @click="change('clothing', true)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import AvatarModel from '~/components/avatar/Avatar-Model.vue';
import { type Avatar, AVATAR_DEFINITIONS } from '~~/types/data';
import Chevron from '../common/CommonChevron.vue';

const avatar: Ref<Avatar> = ref({
  body: 2,
  clothing: 1,
  face: 1,
  hair: 1,
});

function change(part: keyof Avatar, positive: boolean) {
  const definition = AVATAR_DEFINITIONS[part];
  const current = avatar.value[part];
  let next: number | undefined;

  if (current === undefined) {
    next = positive ? 1 : definition.max;
  } else {
    if (positive) {
      next = current >= definition.max ? (definition.optional ? undefined : 1) : current + 1;
    } else {
      next = current <= 1 ? (definition.optional ? undefined : definition.max) : current - 1;
    }
  }

  (avatar.value[part] as number | undefined) = next;
}

const img = useImage();

onMounted(() => {
  for (const [part, def] of Object.entries(AVATAR_DEFINITIONS)) {
    for (let i = 1; i <= def.max; i++) {
        const src = `/resources/avatar/${part}-${i}.png`;
        img(src);
    }
  }
});
</script>

<style scoped lang="scss">
.avatar-creator {
  display: flex;
  flex-direction: row;

  height: 200px;
}

.avatar-show {
  width: 200px;
  height: 200px;
}

.setting {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}
</style>
