import { prisma } from '../prisma';
import { getRedisSync, setRedisSync } from '../backend/redis';
import type { LobbyWord, LobbyWordList } from '../../../types/redis';

export async function chooseRandomWord(wordLists: number[]): Promise<LobbyWord> {
    if (!wordLists || wordLists.length === 0) throw new Error('wordlist cant be empty');

    // Select random LobbyWordList
    const listIndex = Math.floor(Math.random() * wordLists.length);
    const wordListIndex = wordLists[listIndex] ?? -1;

    const wordList = await getCachedWordList(wordListIndex);

    if (wordList.words.length === 0) throw new Error('words in wordlist cant be empty');

    // Select random LobbyWord from chosen list
    const wordIndex = Math.floor(Math.random() * wordList.words.length);
    const word = wordList.words[wordIndex];
    if (!word) throw new Error('selected word empty');
    return word;
}

export async function getCachedWordList(id: number): Promise<LobbyWordList> {
    const wordListData = await getRedisSync(`wordlist-${ id }`);

    if (!wordListData) {
        const wordList = await cacheWordLists([id], true);
        if (!wordList) {
            throw new Error('Wordlist id not found');
        }

        const returnWortlist = wordList[0];
        if (!returnWortlist) throw new Error('wordlist is empty');
        return returnWortlist;
    }

    const wordList: LobbyWordList = JSON.parse(wordListData);

    return wordList;
}

export async function cacheWordLists(wordLists: number[], skipSearch: boolean = false): Promise<LobbyWordList[] | undefined> {
    const searchLists: number[] = [];

    if (!skipSearch) {
        const exists: number[] = [];

        for (const n of wordLists) {
            const data = await getRedisSync(`wordlist-${ n }`);
            if (data) {
                exists.push(n);
            }
        }

        const searchLists = wordLists.filter(n => !exists.includes(n));

        if (searchLists.length == 0) return;
    }
    else {
        for (const list of wordLists) {
            searchLists.push(list);
        }
    }

    const dbWordLists: LobbyWordList[] = await prisma.wordList.findMany({
        where: {
            id: {
                in: searchLists,
            },
        },
        select: {
            id: true,
            name: true,
            description: true,
            words: {
                select: {
                    word: true,
                    id: true,
                },
            },
        },
    });

    for (const list of dbWordLists) {
        setRedisSync(`wordlist-${ list.id }`, JSON.stringify(list), 2 * 24 * 60 * 60 * 1000);
    }

    return dbWordLists;
}
