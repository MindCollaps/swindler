import type { Voted } from '~~/types/redis';
import { defineStore } from 'pinia';

function createEmptyVoted(): Voted {
    return {
        down: { voters: [], voted: false },
        up: { voters: [], voted: false },
        imposter: { voters: [], voted: false },
    };
}

export const useVoteStore = defineStore('vote', {
    state: () => ({
        voted: null as Voted | null,
    }),
    actions: {
        resetVote() {
            this.voted = createEmptyVoted();
        },
        setVoted(voted: Voted | null) {
            this.voted = voted;
        },
        addVote(vote: number, userId?: number, selfVoted: boolean = false) {
            if (!this.voted) {
                this.resetVote();
            }
            if (!this.voted) return;

            const addVoter = (voters: number[], id?: number) => {
                if (id !== undefined && !voters.includes(id)) {
                    voters.push(id);
                }
            };

            switch (vote) {
                case 1:
                    if (selfVoted) {
                        this.voted.down.voted = true;
                    }
                    addVoter(this.voted.down.voters, userId);
                    break;
                case 2:
                    if (selfVoted) {
                        this.voted.up.voted = true;
                    }
                    addVoter(this.voted.up.voters, userId);
                    break;
                case 3:
                    if (selfVoted) {
                        this.voted.imposter.voted = true;
                    }
                    addVoter(this.voted.imposter.voters, userId);
                    break;
            }
        },
        removeVote(vote: number, userId?: number, selfVoted: boolean = false) {
            if (!this.voted) return;

            const removeVoter = (voters: number[], id?: number) => {
                if (id === undefined) return;
                const index = voters.indexOf(id);
                if (index > -1) {
                    voters.splice(index, 1);
                }
            };

            switch (vote) {
                case 1:
                    if (selfVoted) {
                        this.voted.down.voted = false;
                    }
                    removeVoter(this.voted.down.voters, userId);
                    break;
                case 2:
                    if (selfVoted) {
                        this.voted.up.voted = false;
                    }
                    removeVoter(this.voted.up.voters, userId);
                    break;
                case 3:
                    if (selfVoted) {
                        this.voted.imposter.voted = false;
                    }
                    removeVoter(this.voted.imposter.voters, userId);
                    break;
            }
        },
    },
});
