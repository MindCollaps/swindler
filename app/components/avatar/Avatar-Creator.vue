<template>
    <div class="avatar-creator">
        <div class="setting description"><div>Hair</div><div>Eyes</div><div>Mouth</div><div>Body</div><div>Clothing</div><div>Accessory 1</div><div>Accessory 2</div></div>
        <div class="setting lower">
            <chevron @click="change('hair', false)"/>
            <chevron @click="change('eyes', false)"/>
            <chevron @click="change('mouth', false)"/>
            <chevron @click="change('body', false)"/>
            <chevron @click="change('cloth', false)"/>
            <chevron @click="change('accessory1', false)"/>
            <chevron @click="change('accessory2', false)"/>
        </div>
        <div class="avatar-show">
            <avatar-model
                :avatar="avatar"
                size-x="200px"
                size-y="200px"
            />
        </div>
        <div class="setting upper">
            <chevron
                right
                @click="change('hair', true)"
            />
            <chevron
                right
                @click="change('eyes', true)"
            />
            <chevron
                right
                @click="change('mouth', true)"
            />
            <chevron
                right
                @click="change('body', true)"
            />
            <chevron
                right
                @click="change('cloth', true)"
            />
            <chevron
                right
                @click="change('accessory1', true)"
            />
            <chevron
                right
                @click="change('accessory2', true)"
            />
        </div>
        <div class="setting description">
            <div v-if="avatar.hair">{{ avatar.hair }}</div>
            <div v-else>0</div>
            <div>{{ avatar.eyes }}</div>
            <div>{{ avatar.mouth }}</div>
            <div>{{ avatar.body }}</div>
            <div>{{ avatar.cloth }}</div>
            <div v-if="avatar.accessory1">{{ avatar.accessory1 }}</div>
            <div v-else>0</div>
            <div v-if="avatar.accessory2">{{ avatar.accessory2 }}</div>
            <div v-else>0</div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import AvatarModel from '~/components/avatar/Avatar-Model.vue';
import { AVATAR_DEFINITIONS } from '~~/types/data';
import type { Avatar } from '~~/types/data';
import Chevron from '../common/CommonChevron.vue';

const avatar: Ref<Avatar> = ref({
    body: 4,
    eyes: 6,
    cloth: 2,
    mouth: 2,
    hair: 6,
    accessory1: 3,
    accessory2: undefined,
});

function change(part: keyof Avatar, positive: boolean) {
    const { max, optional } = AVATAR_DEFINITIONS[part];

    const getNext = (val: number | undefined) => {
        if (val === undefined) return positive ? 1 : max;
        if (positive) return val >= max ? (optional ? undefined : 1) : val + 1;
        return val <= 1 ? (optional ? undefined : max) : val - 1;
    };

    let next = getNext(avatar.value[part]);

    // Handle collision for accessories
    if (part === 'accessory1' || part === 'accessory2') {
        const otherPart = part === 'accessory1' ? 'accessory2' : 'accessory1';
        const otherVal = avatar.value[otherPart];

        let safeguard = 0;
        // Check if next collides with other accessory
        while (next !== undefined && next === otherVal && safeguard <= max) {
            next = getNext(next);
            safeguard++;
        }
    }

    (avatar.value[part] as number | undefined) = next;
}
</script>

<style scoped lang="scss">
.avatar-creator {
    display: flex;
    flex-direction: row;
    height: 300px;
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

.description {
    justify-content: space-around;
    margin-right: 16px;
}
</style>
