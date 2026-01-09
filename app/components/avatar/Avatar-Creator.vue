<template>
    <div class="avatar-wrap">
        <div
            v-if="avatar"
            class="avatar-creator"
            :style="{
                '--size-x': sizeX,
                '--size-y': sizeY,
            }"
        >
            <div
                v-if="!disabled"
                class="setting description"
            >
                <div>Hair</div>
                <div>Eyes</div>
                <div>Mouth</div>
                <div>Body</div>
                <div>Clothing</div>
                <div>Accessory 1</div>
                <div>Accessory 2</div>
            </div>
            <div
                v-if="!disabled"
                class="setting lower"
            >
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
                    :size-x="sizeX"
                    :size-y="sizeY"
                />
            </div>
            <div
                v-if="!disabled"
                class="setting upper"
            >
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
            <div
                v-if="!disabled"
                class="setting description"
            >
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
    </div>
</template>

<script lang="ts" setup>
import AvatarModel from '~/components/avatar/Avatar-Model.vue';
import { AVATAR_DEFINITIONS } from '~~/types/data';
import type { Avatar } from '~~/types/data';
import Chevron from '../common/CommonChevron.vue';

const props = defineProps({
    avatar: Object as PropType<Avatar>,
    sizeX: String,
    sizeY: String,
    disabled: {
        type: Boolean,
        default: false,
    },
});

function change(part: keyof Avatar, positive: boolean) {
    const { max, optional } = AVATAR_DEFINITIONS[part];

    const getNext = (val: number | undefined) => {
        if (val === undefined) return positive ? 1 : max;
        if (positive) return val >= max ? (optional ? undefined : 1) : val + 1;
        return val <= 1 ? (optional ? undefined : max) : val - 1;
    };

    if (!props.avatar) return;

    let next = getNext(props.avatar[part]);

    // Handle collision for accessories
    if (part === 'accessory1' || part === 'accessory2') {
        const otherPart = part === 'accessory1' ? 'accessory2' : 'accessory1';
        const otherVal = props.avatar[otherPart];

        let safeguard = 0;
        // Check if next collides with other accessory
        while (next !== undefined && next === otherVal && safeguard <= max) {
            next = getNext(next);
            safeguard++;
        }
    }

    (props.avatar[part] as number | undefined) = next;
}
</script>

<style scoped lang="scss">
.avatar-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.avatar-creator {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    height: var(--size-y);
    padding: 32px;
    border-radius: 16px;

    background: $darkgray900;
}

.avatar-show {
    width: var(--size-x);
    height: var(--size-y);
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
