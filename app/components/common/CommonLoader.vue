<template>
    <div
        class="loading-screen"
        :class="smol ? 'loading-screen-smol' : ''"
    >
        <div class="loader"/>
    </div>
</template>

<script setup lang="ts">
defineProps({
    smol: {
        type: Boolean,
    },
});
</script>

<style scoped lang="scss">
.loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;

    &-smol{
        height: fit-content;

        .loader {
            width: 22px;
            height: 22px;
        }
    }
}

.loader {
    transform: rotateZ(45deg);

    width: 48px;
    height: 48px;
    border-radius: 50%;

    color: white;

    perspective: 1000px;

    &::before,
    &::after {
        content: '';

        position: absolute;
        top: 0;
        left: 0;
        transform: rotateX(70deg);

        display: block;

        width: inherit;
        height: inherit;
        border-radius: 50%;

        animation: 1s spin linear infinite;
    }

    &::after {
        transform: rotateY(70deg);
        color: $primary700;
        animation-delay: .4s;
    }
}

@keyframes rotate {
    0% {
        transform: translate(-50%, -50%) rotateZ(0deg);
    }

    100% {
        transform: translate(-50%, -50%) rotateZ(360deg);
    }
}

@keyframes rotateccw {
    0% {
        transform: translate(-50%, -50%) rotate(0deg);
    }

    100% {
        transform: translate(-50%, -50%) rotate(-360deg);
    }
}

@keyframes spin {
    0%,
    100% {
        box-shadow: .2em 0 0 0 currentcolor;
    }

    12% {
        box-shadow: .2em .2em 0 0 currentcolor;
    }

    25% {
        box-shadow: 0 .2em 0 0 currentcolor;
    }

    37% {
        box-shadow: -.2em .2em 0 0 currentcolor;
    }

    50% {
        box-shadow: -.2em 0 0 0 currentcolor;
    }

    62% {
        box-shadow: -.2em -.2em 0 0 currentcolor;
    }

    75% {
        box-shadow: 0 -.2em 0 0 currentcolor;
    }

    87% {
        box-shadow: .2em -.2em 0 0 currentcolor;
    }
}
</style>
