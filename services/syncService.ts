import { db } from '../db';
import { db as firestore } from '../firebase';
import { collection, doc, getDoc, setDoc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { StoryEncyclopedia, Universe } from '../types';

export const syncService = {
    async syncUserData(userId: string) {
        console.log("Starting sync for user:", userId);
        try {
            await this.syncStories(userId);
            await this.syncUniverses(userId);
            console.log("Sync completed successfully");
            return { success: true };
        } catch (error) {
            console.error("Sync failed:", error);
            return { success: false, error };
        }
    },

    async syncStories(userId: string) {
        const localStories = await db.stories.toArray();
        const remoteCollectionRef = collection(firestore, `users/${userId}/stories`);
        const remoteSnapshot = await getDocs(remoteCollectionRef);

        const batch = writeBatch(firestore);
        let batchCount = 0;

        // 1. Sync Up (Local -> Cloud)
        for (const localStory of localStories) {
            const remoteDocRef = doc(remoteCollectionRef, localStory.id);
            // We can optimize this by checking the snapshot map instead of getDoc every time if list is small
            // But for now, let's use the snapshot we already fetched
            const remoteDoc = remoteSnapshot.docs.find(d => d.id === localStory.id);

            let shouldUpload = false;

            if (!remoteDoc) {
                shouldUpload = true;
            } else {
                const remoteData = remoteDoc.data();
                // Compare timestamps (assuming stored as number in both)
                if (localStory.updatedAt > (remoteData.updatedAt || 0)) {
                    shouldUpload = true;
                }
            }

            if (shouldUpload) {
                batch.set(remoteDocRef, localStory);
                batchCount++;
            }
        }

        // 2. Sync Down (Cloud -> Local)
        const storiesToPut: StoryEncyclopedia[] = [];

        for (const remoteDoc of remoteSnapshot.docs) {
            const remoteStory = remoteDoc.data() as StoryEncyclopedia;
            const localStory = localStories.find(s => s.id === remoteStory.id);

            let shouldDownload = false;

            if (!localStory) {
                shouldDownload = true;
            } else {
                if ((remoteStory.updatedAt || 0) > localStory.updatedAt) {
                    shouldDownload = true;
                }
            }

            if (shouldDownload) {
                storiesToPut.push(remoteStory);
            }
        }

        // Commit Cloud Changes
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Uploaded ${batchCount} stories to cloud.`);
        }

        // Commit Local Changes
        if (storiesToPut.length > 0) {
            await db.stories.bulkPut(storiesToPut);
            console.log(`Downloaded ${storiesToPut.length} stories from cloud.`);
        }
    },

    async syncUniverses(userId: string) {
        const localUniverses = await db.universes.toArray();
        const remoteCollectionRef = collection(firestore, `users/${userId}/universes`);
        const remoteSnapshot = await getDocs(remoteCollectionRef);

        const batch = writeBatch(firestore);
        let batchCount = 0;

        // 1. Sync Up
        for (const localUniverse of localUniverses) {
            const remoteDocRef = doc(remoteCollectionRef, localUniverse.id);
            const remoteDoc = remoteSnapshot.docs.find(d => d.id === localUniverse.id);

            let shouldUpload = false;

            if (!remoteDoc) {
                shouldUpload = true;
            } else {
                const remoteData = remoteDoc.data();
                if (localUniverse.updatedAt > (remoteData.updatedAt || 0)) {
                    shouldUpload = true;
                }
            }

            if (shouldUpload) {
                batch.set(remoteDocRef, localUniverse);
                batchCount++;
            }
        }

        // 2. Sync Down
        const universesToPut: Universe[] = [];

        for (const remoteDoc of remoteSnapshot.docs) {
            const remoteUniverse = remoteDoc.data() as Universe;
            const localUniverse = localUniverses.find(u => u.id === remoteUniverse.id);

            let shouldDownload = false;

            if (!localUniverse) {
                shouldDownload = true;
            } else {
                if ((remoteUniverse.updatedAt || 0) > localUniverse.updatedAt) {
                    shouldDownload = true;
                }
            }

            if (shouldDownload) {
                universesToPut.push(remoteUniverse);
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`Uploaded ${batchCount} universes to cloud.`);
        }

        if (universesToPut.length > 0) {
            await db.universes.bulkPut(universesToPut);
            console.log(`Downloaded ${universesToPut.length} universes from cloud.`);
        }
    }
};
