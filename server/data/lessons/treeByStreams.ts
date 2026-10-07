import type { BBLessonPlan } from "../../../src/types/BBLessonPlan.ts";

export const treeByStreams: BBLessonPlan = {
  id: "tree-by-streams",
  title: "Tree By Streams",
  planning: {
    lessonGoals: [
      "Through the tree, the student understands the relationship between the cause of the problem and the solution.",
      "The solution to life's problems and suffering is the Word.",
    ],
    confessionGoals: [
      "Help the student recognise the need to care for their spirit rather than only their external circumstances.",
      "Help the student understand that God's Word nourishes the spirit and confirm continuing to learn it consistently.",
    ],
    weighingGoals: [
      "Weigh the importance of consistently receiving God's Word through intentional priority and investment.",
      "Prioritising God's Word does not mean doing nothing else in life.",
    ],
    actionGoals: [
      "Help the student commit to continuing to learn God's Word consistently through understanding rather than simply being told what to do.",
    ],
  },
  // These references are supplied without a specific teaching-stage association.
  scriptureReferences: ["Lamentations 3:33", "Psalm 107:10-11", "Psalm 107:19-20"],
  flow: {
    referenceMaterials: [
      {
        title: "Life reflection circles",
        description: "Draw approximately five large circles, label each with an important area of the student's life, and rate how well each is going.",
      },
      {
        title: "Life as a tree",
        description: "Represent the student's life as a tree, their important life areas as fruit, and their invisible spirit as the root. Connect the tree's need for water with the spirit's need for God's Word.",
      },
    ],
    intro: {
      goals: ["Help the student understand that God is not causing the problems in their life."],
      // No separate Buy Heart activity was specified in the authoritative material.
      buyHeart: [],
      questionsToCheck: [
        "What does it look like to have a successful life?",
        "Are you living this life right now?",
        "Why not?",
        "Why is your life not this way?",
        "What are you doing to change this situation?",
      ],
      piqueInterest: [
        "Introduce two keys to success in order: reflection, then investment.",
        "Successful people reflect on their current situation and invest based on what they learn.",
        "Reflection helps someone understand their current situation and decide where to invest moving forward.",
        "Encourage the student to reflect on their own life.",
      ],
      examples: ["Elon Musk reflecting on his business before making decisions can illustrate reflection before investment."],
    },
    body: {
      sections: [
        {
          id: "physical-sprout",
          title: "Reflection: identifying the student's life",
          goals: ["Understand the student's life through their fruit."],
          flow: [
            "Ask the student to identify approximately five important areas of their life and rate how well each is going, out of 10 or as a percentage.",
            "Discuss what matters to the student, where life is going well or lacking, and what they want to change.",
            "Encourage honest reflection about the current condition of their life rather than answers that merely sound good.",
          ],
          examples: [
            "Family, career, health, finance and faith are possible life areas, not mandatory answers.",
            "Draw five large circles, write an important life area in each, and rate each before discussing them.",
            "A mirror should accurately reflect what is there; likewise, reflection on life should be honest.",
          ],
        },
        {
          id: "life-as-a-tree",
          title: "Life represented as a tree and fruit",
          flow: [
            "Transition from the student's identified life areas: investing heavily in one area can leave another struggling, and fixing each area one by one can become stressful.",
            "Introduce an underlying cause that may affect all the visible areas.",
            "God compares a prosperous person to a tree. Represent the student's life as the tree and their important life areas as its fruit.",
            "Compare their current condition with the prosperous person to recognise room for growth, not simply to criticise their life.",
          ],
          scriptureReferences: ["Psalm 1:3"],
          questionsToCheck: [
            "Do you want your life to prosper?",
            "How can this tree become healthier?",
            "How can the fruit improve?",
          ],
        },
        {
          id: "diagnosing-the-root",
          title: "Uproot: fixing only the fruit",
          flow: ["Move from the visible problems to the health of the tree and its roots."],
          uproot: [
            "Challenge the assumption that the visible fruit is the fundamental problem and that repairing each life area alone addresses the cause.",
            "A wise farmer investigates the tree's health, especially its roots, rather than putting all their effort into repairing individual fruit.",
          ],
          questionsToCheck: [
            "If career is struggling, should the person simply stop working?",
            "If family is struggling, should they abandon their family?",
            "Should someone completely restart their life?",
          ],
        },
        {
          id: "root-and-spirit",
          title: "Plant: the root represents the spirit",
          flow: ["Distinguish the visible fruit from the invisible root that determines the tree's health."],
          plant: [
            "Connect the invisible root to the person's spirit, explained in relatable terms as mind, heart and thoughts.",
            "As the spirit prospers, the person's life can prosper.",
            "Strengthen the internal/root condition instead of focusing only on external circumstances: mind, heart and thoughts influence decisions affecting visible areas of life.",
          ],
          scriptureReferences: ["3 John 1:2"],
        },
        {
          id: "caring-for-the-spirit",
          title: "Caring for the spirit: planted by water",
          goals: ["Help the student understand that caring for their spirit means being planted by God's Word."],
          flow: [
            "Identify the problem as a dry or unhealthy root and the change of action as caring for the root/spirit.",
            "Transition to water: a tree in dry ground cannot remain healthy and needs a constant supply of water.",
          ],
          scriptureReferences: ["Psalm 1:3"],
          questionsToCheck: ["How do we take care of the spirit?", "What is the spiritual water that gives life to the spirit?"],
        },
        {
          id: "water-and-word",
          title: "God's water is God's Word",
          flow: ["Connect physical water sustaining the body with God's Word sustaining the spirit."],
          plant: [
            "God's Word is compared to water.",
            "Simply encountering or reading words is not enough; the goal is to understand and take in God's Word.",
          ],
          examples: ["Holding water in the mouth without drinking it illustrates encountering the Word without taking it in."],
          scriptureReferences: ["Deuteronomy 32:2"],
          questionsToCheck: ["How often do we need physical water?", "What happens if we go without water?", "What would happen to a tree without water?"],
        },
        {
          id: "word-guiding-life",
          title: "The Word changes and guides the person",
          flow: [
            "God is connected with His Word. Taking in God's Word allows the person's thinking to increasingly align with God's thoughts.",
            "Connect this to the student's mind, decisions and life.",
            "God desires to guide the person toward a hopeful and prosperous future; connect this back to the student's earlier reflection.",
          ],
          scriptureReferences: ["John 1:1", "Jeremiah 29:11"],
        },
        {
          id: "consistency-and-prioritisation",
          title: "Consistency and prioritisation",
          flow: [
            "Spiritual growth requires consistently receiving God's Word.",
            "Seeking God with all your heart involves prioritisation and investment, without doing nothing else in life.",
            "Use the student's experience of seeking something wholeheartedly to explain intentional priority.",
          ],
          examples: ["We do not drink water once and assume we never need it again; we need it continually."],
          scriptureReferences: ["Jeremiah 29:11-13"],
          questionsToCheck: ["What is something you have sought after with all your heart?"],
        },
      ],
    },
    conclusion: {
      goals: ["Help the student confirm regular Bible study."],
      // The plan specifies the intended confession, but supplies no separate question wording.
      questionsForConfession: [],
      connectSprout: ["Connect the Word's guidance of thinking and life back to the student's earlier reflection and the areas they want to change."],
      weighing: [
        "Weigh consistent, appropriately prioritised learning as the way to care for the spirit.",
        "The lesson suggests study approximately 2–3 times per week, not a universal requirement to agree to exactly three sessions.",
      ],
      action: ["Help the student reach a commitment to continue learning God's Word consistently through understanding rather than simply telling them what to do."],
      // No separate homework assignment was supplied.
      homework: [],
      examples: ["Physical improvement requires consistent training, not training once; spiritual growth likewise requires consistent learning."],
      scriptureReferences: ["John 1:1"],
    },
  },
  // Example delivery only; not the authoritative teaching standard.
  referenceTranscript: {
    sections: [
      {
        id: "intro",
        title: "Introduction",
        content: `Tree By Streams

1. Intro

Buy Heart

Questions to check:
- What does it look like to have a successful life?
- Are you living this life right now?
- Why not? Why is your life not this way?
- What are you doing to change this situation?

Pique Interest:
- Did you know there are two keys to success?
- Do you want to be a successful person? Wouldn't you like to know?

First one is reflection: every successful person in the world, no matter what they do, they reflect. Then once they've reflected what do they do? They invest.

These two components combined allow someone to be successful.

Example:
Elon Musk has the most money in the world. How did he become successful? He made decisions. How did he make those decisions? He had to reflect on his business.

If he makes decisions without reflecting, will it go well?

No, so we must reflect so that we can invest in the future.

So then what's the natural next step for us? It's to reflect on our lives, right? Why? Because our experiences make up who we are. Then if we can understand these things, it can become clear what we need to invest in moving forward.`,
      },
      {
        id: "physical-sprout",
        title: "Reflecting on life",
        content: `I'd like you to draw five big circles, and in those circles I'd like you to write down the five most important things in your life currently. I then would like you to rate them on how well they are going out of 10. Then we can speak about them when you're finished.

When you go to the gym and look into the mirror, I look like I have a six pack, but when I get home and look in the mirror I have a pot belly. I'm like, what's happened here? That mirror has lied to me.

So should the mirror lie to us?

When we reflect, what should we be?

Honest.

I'm not going to judge you. I'm here to show you how to reflect and invest.`,
      },
      {
        id: "life-as-a-tree",
        title: "Life as a tree",
        content: `Lesson Flow:

If you want to improve your work, what do you do? You go there and invest your time.

But when you focus on this, what then struggles? The other areas of your life, right?

Everything becomes stressful. When you go through these different areas one by one it becomes very stressful. That's why life feels this way for you now. That's why you don't feel success.

But through God's Word we can see there is a way to improve our lives. Then shouldn't we see?

Psalm 1:3

There is a person where everything in their life is going well. This is God's person; everything is prosperous.

But when we look at your life, what do we see? It's not 100%, right?

So there is a gap between your life and God's person, so there is growth that can take place, no?

So then how do we become this person?

Do you want your life to prosper?

God said that person is like a tree.

[draw tree]

This is your tree and these are your fruits.

So then how can we make this tree go from 50 → 100?

What do you think?

What would you do to the tree?`,
      },
      {
        id: "diagnosing-the-root",
        title: "Looking at the roots",
        content: `These fruits are rotting, right?

Are you just going to cut them off?

Will you stop working/studying?

Will you just leave your family and never see them again?

Will you just start a new tree?

Are you going to reset your life back to age one and start again?

We can't cut these things off, but we have to improve them. But then how?

We must focus on the roots of the tree, right?

If you saw a farmer putting all his effort into one fruit, wouldn't you think he's crazy?

The farmer that focuses on the roots is the farmer that clearly knows what he's doing.`,
      },
      {
        id: "root-and-spirit",
        title: "The root and spirit",
        content: `The roots are the invisible part of the tree and the fruits are the visible part.

So what is the most important part of the tree?

It's the roots.

So now we have to understand: what is this root?

It is the invisible thing in me.

It's your spirit.

Our spirit is our mind and heart; it's our thoughts.

So God is telling you the most important part of your life is your mind, your thoughts.

But what do we tend to focus on?

All the physical things.

Do you ever wake up and say to yourself, "How is my spirit?"

It's like trying to play basketball and improve your skill without knowing the rules of basketball.

3 John 1:2

As we grow spiritually, our mind becomes stronger and therefore all the areas of our life can be guided by a strong mind.

When our mind is strong, the decisions we make can be strong and healthy.

So what will you do now?`,
      },
      {
        id: "water-and-word",
        title: "Water and the Word",
        content: `Then how can we look after our spirit?

What is it that makes it prosperous?

It's this water, right?

Then what is this water?

Deuteronomy 32:2

Importance of water physically.

Why does God say His Word is like water?

Because without it our spirit will die.

Example:

Drinking water / holding it in your mouth.

It's not just about reading the Word; we need to understand it.

So have we been able to understand the Word?

Through this our life can be changed.`,
      },
      {
        id: "word-guiding-life",
        title: "The Word guiding life",
        content: `Then why is it so important for our lives?

John 1:1

If I'm taking in this Word, it means my mind will change according to God's thoughts.

So my life can be led by God.

Then what does God say about our life?

Jeremiah 29:11.

He has the plan to help us prosper.

Don't we want this kind of life?

Are we living it now?

No.

Then that's why God has brought us here.`,
      },
      {
        id: "consistency-and-prioritisation",
        title: "Consistency and prioritisation",
        content: `Then how often do we drink water?

If we just drink once, then what will happen?

If we miss one day, what do we do?

We desperately search for water to quench our thirst to live.

Then in Jeremiah 29:11-13 God says that you will find me when you seek me with all your heart.

Meaning prioritisation.

Meaning investing in my spirit.

Prioritising God's Word.

Then what was something you sought for with all your heart?

That's how God wants us to seek for Him.

It doesn't mean we shouldn't do anything else, but we should prioritise.`,
      },
      {
        id: "continuing-study",
        title: "Continuing to study",
        content: `So how often do you think God wants you to come to the Word?

Then how often do you want to come to learn the Word?

I'm not able to meet daily, but we can meet three times a week.`,
      },
    ],
  },
};
