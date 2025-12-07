<template>
    <div>
        <common-button @click="popupVisible=!popupVisible">Report</common-button>
        <common-popup
            :is-visible="popupVisible"
            @close="popupVisible=false"
            @submit="submitReport()"
        >
            <div class="basic-dashboard--popup-content">
                <h2>Reporting {{ word.word }}</h2>
                <p>Select the reason</p>

                <select v-model="selectedReason">
                    <option value="">-- Select a reason --</option>
                    <option
                        v-for="reason in REPORT_REASONS"
                        :key="reason.value"
                        :value="reason.value"
                    >
                        {{ reason.label }}
                    </option>
                </select>

                <br>

                <p>Provide some details with context: </p>
                <textarea
                    v-model="reportDetails"
                    cols="50"
                    name="Description"
                    rows="4"
                />
            </div>
        </common-popup>
    </div>
</template>

<script lang="ts" setup>
import CommonPopup from '../common/CommonPopup.vue';
import { ReportReason } from '~~/types/word';

const props = defineProps({
    word: {
        type: Object as PropType<Word>,
        required: true,
    },
});

const REPORT_REASONS = [
    { value: ReportReason.INAPPROPRIATE, label: 'Inappropriate content' },
    { value: ReportReason.SPAM, label: 'Spam' },
    { value: ReportReason.OFFENSIVE, label: 'Offensive language' },
    { value: ReportReason.INCORRECT, label: 'Incorrect information' },
    { value: ReportReason.OTHER, label: 'Other' },
];

interface Word {
    id: number;
    word: string;
}

const popupVisible = ref<boolean>(false);
const reportDetails = ref<string>('');
const selectedReason = ref<ReportReason | ''>('');

async function submitReport() {
    console.log(1);
    if (!selectedReason.value || props.word.id == -1) return;
    console.log(2);

    await $fetch('/api/v1/words/flag', {
        method: 'POST',
        body: {
            wordId: props.word.id,
            reason: selectedReason.value,
            message: reportDetails.value,
        },
    });

    popupVisible.value = false;
}
</script>
