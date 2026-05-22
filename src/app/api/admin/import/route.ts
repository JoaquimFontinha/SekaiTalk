import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StepType } from "@prisma/client";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = await req.json();
  const counts = { cities: 0, pois: 0, scenes: 0, characters: 0, appearances: 0, quests: 0, lessons: 0 };

  if (payload.cityRecords) {
    for (const c of payload.cityRecords) {
      const { pois: _p, createdAt: _ca, updatedAt: _ua, ...data } = c;
      await prisma.cityRecord.upsert({ where: { id: data.id }, update: data, create: data });
      counts.cities++;
    }
  }

  if (payload.poiRecords) {
    for (const p of payload.poiRecords) {
      const { city: _c, createdAt: _ca, updatedAt: _ua, ...data } = p;
      await prisma.pOIRecord.upsert({ where: { id: data.id }, update: data, create: data });
      counts.pois++;
    }
  }

  if (payload.scenes) {
    for (const s of payload.scenes) {
      const { createdAt: _ca, updatedAt: _ua, id: _id, ...data } = s;
      await prisma.scene.upsert({ where: { poiId: data.poiId }, update: data, create: data });
      counts.scenes++;
    }
  }

  if (payload.characters) {
    for (const c of payload.characters) {
      const { appearances: _a, memories: _m, createdAt: _ca, updatedAt: _ua, ...data } = c;
      await prisma.character.upsert({ where: { id: data.id }, update: data, create: data });
      counts.characters++;
    }
  }

  if (payload.appearances) {
    for (const a of payload.appearances) {
      const { id: _id, character: _c, ...data } = a;
      await prisma.characterAppearance.upsert({
        where: { characterId_poiId: { characterId: data.characterId, poiId: data.poiId } },
        update: data,
        create: data,
      });
      counts.appearances++;
    }
  }

  if (payload.quests) {
    for (const q of payload.quests) {
      const { tasks, userProgress: _up, vocabProgress: _vp, sessionRecords: _sr, createdAt: _ca, updatedAt: _ua, ...qData } = q;
      await prisma.quest.upsert({ where: { id: qData.id }, update: qData, create: qData });
      counts.quests++;
      if (tasks) {
        for (const t of tasks) {
          const { choices, quest: _q, userProgress: _tp, createdAt: _ca2, ...tData } = t;
          await prisma.questTask.upsert({ where: { id: tData.id }, update: tData, create: tData });
          if (choices) {
            for (const ch of choices) {
              const { task: _tk, ...chData } = ch;
              await prisma.taskChoice.upsert({ where: { id: chData.id }, update: chData, create: chData });
            }
          }
        }
      }
    }
  }

  if (payload.lessons) {
    for (const l of payload.lessons) {
      const { steps, progress: _p, createdAt: _ca, updatedAt: _ua, ...lData } = l;
      await prisma.lesson.upsert({ where: { id: lData.id }, update: lData, create: lData });
      counts.lessons++;
      if (steps) {
        for (const s of steps) {
          const { lesson: _l, ...sData } = s;
          sData.type = sData.type as StepType;
          await prisma.lessonStep.upsert({ where: { id: sData.id }, update: sData, create: sData });
        }
      }
    }
  }

  return NextResponse.json({ imported: counts });
}
