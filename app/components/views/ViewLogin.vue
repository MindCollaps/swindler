<template>
    <template v-if="ready">
        <common-button
            v-if="!loggedIn"
            href="/login"
        >Login</common-button>
        <common-button
            v-else-if="loggedIn"
            href="/profile"
            icon-width="45px"
            type="transparent"
        >
            <template #default>
                <div class="loggedin-view">
                    USERNAME
                </div>
            </template>
        </common-button>
    </template>
    <template v-else>
        <common-loader smol/>
    </template>
</template>

<script setup lang="ts">
import CommonLoader from '../common/CommonLoader.vue';

const ready = ref(false);

const { loggedIn } = useUserSession();

onMounted(() => {
    ready.value = true;
});
</script>

<style scoped lang="scss">
.notification-indicator {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 22px;
    height: 22px;
    border-radius: 50%;

    color: $lightgray0;

    background: $warning600;
}

.loggedin-view {
    display: flex;
    flex-direction: row;
    gap: 16px;
    align-items: center
}
</style>
