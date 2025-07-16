-- CreateEnum
CREATE TYPE "GameEventType" AS ENUM ('VotedCorrectly', 'VotedIncorrectly', 'VotedAbstain', 'ReceivedUpVote', 'ReceivedDownVote');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "xp" INTEGER DEFAULT 0,
    "level" INTEGER DEFAULT 0,
    "gamesPlayed" INTEGER DEFAULT 0,
    "admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StarredList" (
    "wordlistId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "StarredList_pkey" PRIMARY KEY ("wordlistId","userId")
);

-- CreateTable
CREATE TABLE "UserFriends" (
    "userId" INTEGER NOT NULL,
    "friendId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "UserFriends_pkey" PRIMARY KEY ("userId","friendId")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "isCustom" BOOLEAN DEFAULT false,
    "fromUserId" INTEGER,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlaggedWord" (
    "id" SERIAL NOT NULL,
    "reporter" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "reason" INTEGER NOT NULL,
    "message" TEXT,
    "reporterUserId" INTEGER,

    CONSTRAINT "FlaggedWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldList" (
    "id" SERIAL NOT NULL,
    "from" INTEGER,
    "shared" BOOLEAN NOT NULL,
    "public" BOOLEAN NOT NULL,
    "system" BOOLEAN NOT NULL,

    CONSTRAINT "WorldList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" SERIAL NOT NULL,
    "founderId" INTEGER NOT NULL,
    "founded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "players" INTEGER[],
    "token" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL,
    "gameStarted" BOOLEAN NOT NULL,
    "gameId" INTEGER,
    "round" INTEGER NOT NULL,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRules" (
    "id" SERIAL NOT NULL,
    "maxRounds" INTEGER NOT NULL DEFAULT 4,
    "rounds" INTEGER NOT NULL DEFAULT 4,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "timeLimited" BOOLEAN NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "allowSpecialGameMode" BOOLEAN NOT NULL,
    "membersCanAddWordLists" BOOLEAN NOT NULL DEFAULT false,
    "membersCanAddCustomWordLists" BOOLEAN NOT NULL DEFAULT false,
    "lobbyId" INTEGER NOT NULL,

    CONSTRAINT "GameRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "lobbyId" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "turn" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "imposter" INTEGER NOT NULL,
    "specialGameMode" INTEGER NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" SERIAL NOT NULL,
    "initiatorId" INTEGER NOT NULL,
    "receiverId" INTEGER,
    "triggered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "GameEventType" NOT NULL,
    "lobbyId" INTEGER NOT NULL,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserToWorldList" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserToWorldList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WordToWorldList" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_WordToWorldList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRules_lobbyId_key" ON "GameRules"("lobbyId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_lobbyId_key" ON "Game"("lobbyId");

-- CreateIndex
CREATE INDEX "_UserToWorldList_B_index" ON "_UserToWorldList"("B");

-- CreateIndex
CREATE INDEX "_WordToWorldList_B_index" ON "_WordToWorldList"("B");

-- AddForeignKey
ALTER TABLE "StarredList" ADD CONSTRAINT "StarredList_wordlistId_fkey" FOREIGN KEY ("wordlistId") REFERENCES "WorldList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarredList" ADD CONSTRAINT "StarredList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFriends" ADD CONSTRAINT "UserFriends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFriends" ADD CONSTRAINT "UserFriends_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlaggedWord" ADD CONSTRAINT "FlaggedWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlaggedWord" ADD CONSTRAINT "FlaggedWord_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRules" ADD CONSTRAINT "GameRules_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToWorldList" ADD CONSTRAINT "_UserToWorldList_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToWorldList" ADD CONSTRAINT "_UserToWorldList_B_fkey" FOREIGN KEY ("B") REFERENCES "WorldList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WordToWorldList" ADD CONSTRAINT "_WordToWorldList_A_fkey" FOREIGN KEY ("A") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WordToWorldList" ADD CONSTRAINT "_WordToWorldList_B_fkey" FOREIGN KEY ("B") REFERENCES "WorldList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
