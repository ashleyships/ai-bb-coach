type LessonStepProps = {
  selectedLesson: string;
  onLessonChange: (lesson: string) => void;
};

function LessonStep({ selectedLesson, onLessonChange }: LessonStepProps) {
  return (
    <section className="practice-lesson-section">
      <h2>Lesson</h2>
      <p>Select the lesson you want to practise.</p>
      <label htmlFor="lesson">Lesson</label>

      <select
        id="lesson"
        value={selectedLesson}
        onChange={(event) => {
          onLessonChange(event.target.value);
        }}
      >
        <option value="">Select a lesson</option>
        <option value="introduction-to-bible">Introduction to Bible</option>
        <option value="tree-by-streams">Tree by Streams</option>
        <option value="how-to-meet-god">How to Meet God</option>
        <option value="blessings-for-those-who-depend-on-god">
          Blessings for Those who Depend on God
        </option>
        <option value="faith-like-abraham">Faith like Abraham</option>
        <option value="why-jesus-is-the-messiah">
          Why Jesus is the Messiah
        </option>
        <option value="god-and-satan">God and Satan</option>
        <option value="four-fields">Four Fields</option>
      </select>
    </section>
  );
}

export default LessonStep;
