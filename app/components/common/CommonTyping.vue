<template>
    <div class="typing-ani">
        <div class="dot"/>
        <div class="dot"/>
        <div class="dot"/>
    </div>
</template>

<script setup lang="ts">
import { animate, stagger } from 'animejs';

onMounted(() => {
    const dots = document.querySelectorAll('.dot');
    animate(dots, {
        translateY: [0, -10, 0],
        delay: stagger(200),
        duration: 500,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
    });

    animate(dots, {
        opacity: [1, 0.5, 1],
        delay: stagger(200),
        duration: 500,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
    });
});
</script>

<style lang="scss" scoped>
.typing-ani {
    display: flex;
    align-items: center;
    justify-content: center;
}

.dot {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;

    background-color: $lightgray50;
}
</style>
