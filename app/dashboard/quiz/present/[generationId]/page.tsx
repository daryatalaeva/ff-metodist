import { prisma } from "@/lib/db/prisma";
import type { QuizResult } from "@/lib/types";
import ClassroomPresenter from "@/components/quiz/ClassroomPresenter";
import CloseButton from "@/components/quiz/CloseButton";

interface Props {
  params: { generationId: string };
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 80 }}>
      <p style={{ fontSize: 18, color: "#555", marginBottom: 24 }}>{message}</p>
      <CloseButton />
    </div>
  );
}

export default async function PresentPage({ params }: Props) {
  const { generationId } = params;

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
  });

  if (!generation || !generation.resultJson) {
    return <ErrorScreen message="Тест не найден" />;
  }

  let quiz: QuizResult;
  try {
    quiz = generation.resultJson as unknown as QuizResult;
    if (!quiz.questions || !Array.isArray(quiz.questions)) throw new Error();
  } catch {
    return <ErrorScreen message="Не удалось загрузить тест" />;
  }

  return <ClassroomPresenter quiz={quiz} />;
}
