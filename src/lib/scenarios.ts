// Animated driving scenarios. Each scenario describes a small 2.5D diorama
// (flat 2D road layout rendered inside a lit 3D world) plus a single-choice question.

export type Vec2 = [number, number];
export type ActorKind = "car" | "truck" | "bus" | "bike" | "motorcycle" | "pedestrian" | "tram" | "train";
export type Arc = { c: Vec2; r: number; a0: number; a1: number };
export type Ease = "linear" | "in" | "out" | "inout";
/** One timed leg of a journey. `path` waypoints are filleted with radius `r`
 *  so vehicles follow a realistic turning curve instead of a hard corner. */
export type Move = { path: Vec2[]; t0: number; t1: number; r?: number; ease?: Ease };
export type Actor = {
  kind: ActorKind;
  color?: string;
  label?: string;
  start?: Vec2;
  moves?: Move[];
  from?: Vec2;
  to?: Vec2;
  arc?: Arc;
  t0?: number;
  t1?: number;
  hero?: boolean;
  face?: number;
  brake?: boolean;
  siren?: boolean;
};
export type Layout = "cross" | "tjunction" | "roundabout" | "straight" | "dual" | "parking" | "rail";
export type SceneProp = { icon: string; at: Vec2; facing?: number };
export type SceneLight = { at: Vec2; state: "red" | "green" | "orange" };
export type SceneConfig = {
  layout: Layout;
  actors: Actor[];
  signs?: SceneProp[];
  lights?: SceneLight[];
  crosswalk?: boolean;
  weather?: "rain" | "fog" | "night";
};
export type Scenario = {
  id: string;
  level: number;
  title: string; titleAr: string;
  situation: string; situationAr: string;
  question: string; questionAr: string;
  choices: { fr: string; ar: string }[];
  answer: number;
  explanation: string; explanationAr: string;
  scene: SceneConfig;
  duration?: number;
  /** Point of the timeline (0-1) where the scene freezes to ask the question.
   *  Scenarios with an ordered solution pause right after every vehicle has
   *  reached the intersection, then replay the crossing order as the answer. */
  pauseAt?: number;
};

const HERO = "#6a63ef";
const hero = (from: Vec2, to: Vec2, extra: Partial<Actor> = {}): Actor => ({ kind: "car", color: HERO, hero: true, from, to, ...extra });

export const scenarios: Scenario[] = [
  // ───────────────── Niveau 2 · Intersections & feux ─────────────────
  {
    id: "l2-feu-rouge", level: 2,
    title: "Le feu passe au rouge", titleAr: "الإشارة تتحول إلى الأحمر",
    situation: "Vous approchez du carrefour et le feu vient de passer au rouge.", situationAr: "تقترب من التقاطع وقد تحولت الإشارة إلى الأحمر.",
    question: "Que devez-vous faire ?", questionAr: "ماذا يجب أن تفعل؟",
    choices: [{ fr: "M'arrêter avant la ligne d'arrêt", ar: "أتوقف قبل خط التوقف" }, { fr: "Accélérer pour passer", ar: "أسرع للمرور" }, { fr: "Passer si la voie est libre", ar: "أمر إذا كان الطريق خالياً" }],
    answer: 0,
    explanation: "Au feu rouge l'arrêt est obligatoire avant la ligne, même si le carrefour paraît dégagé.", explanationAr: "عند الضوء الأحمر التوقف إجباري قبل الخط حتى لو بدا التقاطع خالياً.",
    scene: { layout: "cross", crosswalk: true, lights: [{ at: [4.2, 4.4], state: "red" }], actors: [hero([1.5, 13], [1.5, 6.9], { brake: true }), { kind: "car", color: "#eb9a58", from: [-13, 1.5], to: [1.2, 1.5] }] },
  },
  {
    id: "l2-feu-vert", level: 2,
    title: "Le feu est vert", titleAr: "الإشارة خضراء",
    situation: "Le feu est vert et la voie devant vous est dégagée.", situationAr: "الإشارة خضراء والطريق أمامك خالٍ.",
    question: "Quelle est la bonne réaction ?", questionAr: "ما هو التصرف الصحيح؟",
    choices: [{ fr: "Avancer en restant vigilant", ar: "أتقدم مع البقاء يقظاً" }, { fr: "M'arrêter par précaution", ar: "أتوقف احتياطاً" }, { fr: "Accélérer sans regarder", ar: "أسرع دون النظر" }],
    answer: 0,
    explanation: "Le vert autorise le passage, mais la vigilance reste nécessaire (piétons, véhicules en retard).", explanationAr: "الضوء الأخضر يسمح بالمرور مع البقاء منتبهاً للراجلين والسيارات المتأخرة.",
    scene: { layout: "cross", crosswalk: true, lights: [{ at: [4.2, 4.4], state: "green" }], actors: [hero([1.5, 13], [1.5, 0.5])] },
  },
  {
    id: "l2-feu-orange", level: 2,
    title: "Le feu passe à l'orange", titleAr: "الإشارة تتحول إلى البرتقالي",
    situation: "Le feu passe à l'orange alors que vous pouvez encore vous arrêter sans danger.", situationAr: "تتحول الإشارة إلى البرتقالي وما زال بإمكانك التوقف بأمان.",
    question: "Quelle décision prendre ?", questionAr: "ما القرار الصحيح؟",
    choices: [{ fr: "M'arrêter, l'orange annonce le rouge", ar: "أتوقف، فالبرتقالي يسبق الأحمر" }, { fr: "Accélérer pour franchir", ar: "أسرع لأعبر" }, { fr: "Klaxonner et passer", ar: "أنبه وأمر" }],
    answer: 0,
    explanation: "Le feu orange impose l'arrêt lorsque celui-ci peut se faire en toute sécurité.", explanationAr: "الضوء البرتقالي يفرض التوقف إذا كان ذلك ممكناً بأمان.",
    scene: { layout: "cross", crosswalk: true, lights: [{ at: [4.2, 4.4], state: "orange" }], actors: [hero([1.5, 13], [1.5, 7.1], { brake: true })] },
  },
  {
    id: "l2-pieton", level: 2,
    title: "Un piéton traverse", titleAr: "راجل يعبر الطريق",
    situation: "Un piéton s'engage sur le passage protégé juste devant vous.", situationAr: "يبدأ أحد الراجلين العبور على الممر أمامك مباشرة.",
    question: "Quelle action est la plus sûre ?", questionAr: "ما التصرف الأكثر أماناً؟",
    choices: [{ fr: "M'arrêter et le laisser traverser", ar: "أتوقف وأتركه يعبر" }, { fr: "Klaxonner pour le presser", ar: "أنبه لأستعجله" }, { fr: "Le contourner rapidement", ar: "أتجاوزه بسرعة" }],
    answer: 0,
    explanation: "Le piéton engagé sur un passage protégé est toujours prioritaire.", explanationAr: "الراجل الذي بدأ العبور على الممر له الأسبقية دائماً.",
    scene: { layout: "cross", crosswalk: true, signs: [{ icon: "/signs/A13b.svg", at: [4.4, 7] }], actors: [hero([1.5, 13], [1.5, 7.3], { brake: true }), { kind: "pedestrian", color: "#3f6ea8", from: [4.4, 4.4], to: [0.2, 4.4] }] },
  },
  {
    id: "l2-carrefour-bloque", level: 2,
    title: "Carrefour encombré", titleAr: "تقاطع مزدحم",
    situation: "Le feu est vert mais les voitures sont arrêtées au milieu du carrefour.", situationAr: "الإشارة خضراء لكن السيارات متوقفة وسط التقاطع.",
    question: "Que faites-vous ?", questionAr: "ماذا تفعل؟",
    choices: [{ fr: "Attendre avant le carrefour pour ne pas le bloquer", ar: "أنتظر قبل التقاطع حتى لا أعرقله" }, { fr: "M'engager quand même", ar: "أدخل التقاطع رغم ذلك" }, { fr: "Doubler par la droite", ar: "أتجاوز من اليمين" }],
    answer: 0,
    explanation: "On ne s'engage jamais dans un carrefour si l'on ne peut pas le dégager : cela bloque les autres usagers.", explanationAr: "لا تدخل التقاطع إذا لم تستطع إخلاءه، لأن ذلك يعرقل باقي المستعملين.",
    scene: { layout: "cross", crosswalk: true, lights: [{ at: [4.2, 4.4], state: "green" }], actors: [hero([1.5, 13], [1.5, 7.3], { brake: true }), { kind: "car", color: "#e8705f", from: [-6, 1.5], to: [0.6, 1.5], brake: true }, { kind: "truck", color: "#d7b45c", from: [-12, 1.5], to: [-4.6, 1.5], brake: true }] },
  },
  {
    id: "l2-tourner-gauche", level: 2,
    title: "Tourner à gauche au feu", titleAr: "الانعطاف يساراً عند الإشارة",
    situation: "Vous voulez tourner à gauche au feu vert, un véhicule arrive en face tout droit.", situationAr: "تريد الانعطاف يساراً والإشارة خضراء، وسيارة قادمة من الأمام مباشرة.",
    question: "Qui passe en premier ?", questionAr: "من يمر أولاً؟",
    choices: [{ fr: "Le véhicule qui vient en face", ar: "السيارة القادمة من الأمام" }, { fr: "Moi, je tourne avant lui", ar: "أنا، أنعطف قبله" }, { fr: "Le premier qui klaxonne", ar: "من ينبه أولاً" }],
    answer: 0,
    explanation: "En tournant à gauche vous devez céder le passage aux véhicules venant en sens inverse.", explanationAr: "عند الانعطاف يساراً يجب إعطاء الأسبقية للسيارات القادمة في الاتجاه المعاكس.",
    scene: { layout: "cross", crosswalk: true, lights: [{ at: [4.2, 4.4], state: "green" }], actors: [hero([1.5, 13], [1.5, 5.8], { brake: true }), { kind: "car", color: "#56b2a0", from: [-1.5, -13], to: [-1.5, 2.2] }] },
  },

  // ───────────────── Niveau 3 · Les priorités ─────────────────
  {
    id: "l3-stop", level: 3,
    title: "Panneau STOP", titleAr: "علامة قف",
    situation: "Vous arrivez à un STOP, une voiture circule sur la route transversale.", situationAr: "تصل إلى علامة قف، وسيارة تسير في الطريق المتقاطع.",
    question: "Quelle manœuvre est correcte ?", questionAr: "ما المناورة الصحيحة؟",
    choices: [{ fr: "Arrêt complet puis céder le passage", ar: "توقف كامل ثم إعطاء الأسبقية" }, { fr: "Ralentir puis continuer", ar: "تخفيف السرعة ثم المواصلة" }, { fr: "Passer avant l'autre voiture", ar: "المرور قبل السيارة الأخرى" }],
    answer: 0,
    explanation: "Le STOP impose l'arrêt absolu, puis la priorité à tous les véhicules de la route croisée.", explanationAr: "علامة قف تفرض التوقف التام ثم إعطاء الأسبقية لكل سيارات الطريق المتقاطع.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--stop.svg", at: [4.4, 4.6] }], actors: [hero([1.5, 13], [1.5, 6.7], { brake: true }), { kind: "car", color: "#eb9a58", from: [-13, 1.5], to: [-0.4, 1.5] }] },
  },
  {
    id: "l3-cedez", level: 3,
    title: "Cédez le passage", titleAr: "أعط الأسبقية",
    situation: "Un panneau « cédez le passage » annonce l'intersection, un véhicule arrive de votre gauche.", situationAr: "علامة «أعط الأسبقية» تسبق التقاطع، وسيارة قادمة من يسارك.",
    question: "Que faites-vous ?", questionAr: "ماذا تفعل؟",
    choices: [{ fr: "Ralentir et le laisser passer", ar: "أخفف السرعة وأتركه يمر" }, { fr: "Passer rapidement devant lui", ar: "أمر بسرعة أمامه" }, { fr: "M'arrêter obligatoirement même si c'est libre", ar: "أتوقف إجبارياً حتى لو كان الطريق خالياً" }],
    answer: 0,
    explanation: "« Cédez le passage » n'impose pas l'arrêt, mais vous devez laisser passer les véhicules sur la route prioritaire.", explanationAr: "«أعط الأسبقية» لا تفرض التوقف، لكن يجب ترك سيارات الطريق ذي الأسبقية تمر.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--yield.svg", at: [4.4, 5.2] }], actors: [hero([1.5, 13], [1.5, 6.9], { brake: true }), { kind: "car", color: "#56b2a0", from: [-13, 1.5], to: [0.2, 1.5] }] },
  },
  {
    id: "l3-priorite-droite", level: 3,
    title: "Priorité à droite", titleAr: "الأسبقية لليمين",
    situation: "Carrefour sans signalisation : une voiture arrive sur votre droite.", situationAr: "تقاطع بدون علامات: سيارة قادمة من جهة يمينك.",
    question: "Qui a la priorité ?", questionAr: "لمن الأسبقية؟",
    choices: [{ fr: "La voiture venant de droite", ar: "السيارة القادمة من اليمين" }, { fr: "Moi, je roule tout droit", ar: "أنا، لأنني أسير مستقيماً" }, { fr: "Le véhicule le plus rapide", ar: "السيارة الأسرع" }],
    answer: 0,
    explanation: "Sans panneau ni feu, la priorité revient au véhicule venant de la droite.", explanationAr: "بدون علامة أو إشارة ضوئية، الأسبقية للسيارة القادمة من اليمين.",
    scene: { layout: "cross", signs: [{ icon: "/signs/warning--crossroads-with-priority-to-the-right.svg", at: [4.6, 7.2] }], actors: [hero([1.5, 13], [1.5, 6.7], { brake: true }), { kind: "car", color: "#e8705f", from: [13, -1.5], to: [0.6, -1.5] }] },
  },
  {
    id: "l3-route-prioritaire", level: 3,
    title: "Route prioritaire", titleAr: "طريق ذات أسبقية",
    situation: "Vous circulez sur une route prioritaire, une voiture attend sur la route latérale.", situationAr: "تسير في طريق ذات أسبقية، وسيارة تنتظر في الطريق الجانبي.",
    question: "Comment réagir ?", questionAr: "كيف تتصرف؟",
    choices: [{ fr: "Poursuivre en restant vigilant", ar: "أواصل السير مع الانتباه" }, { fr: "M'arrêter pour la laisser passer", ar: "أتوقف لأتركها تمر" }, { fr: "Accélérer fortement", ar: "أسرع بقوة" }],
    answer: 0,
    explanation: "Sur une route prioritaire vous gardez la priorité, sans pour autant cesser d'être prudent.", explanationAr: "في الطريق ذات الأسبقية تحتفظ بحق المرور مع البقاء حذراً.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--priority-road.svg", at: [4.4, 6.4] }], actors: [hero([1.5, 13], [1.5, 1.2]), { kind: "car", color: "#eb9a58", from: [-8.5, 1.5], to: [-4.6, 1.5], brake: true }] },
  },
  {
    id: "l3-giratoire-entree", level: 3,
    title: "Entrer dans un giratoire", titleAr: "الدخول إلى المدار",
    situation: "À l'entrée du rond-point, une voiture circule déjà sur l'anneau.", situationAr: "عند مدخل المدار، توجد سيارة تدور داخله.",
    question: "Qui passe en premier ?", questionAr: "من يمر أولاً؟",
    choices: [{ fr: "Le véhicule déjà engagé sur l'anneau", ar: "السيارة الموجودة داخل المدار" }, { fr: "Moi, j'arrive par la droite", ar: "أنا، لأنني قادم من اليمين" }, { fr: "Celui qui s'engage le plus vite", ar: "من يدخل أسرع" }],
    answer: 0,
    explanation: "À l'entrée d'un giratoire signalé, les véhicules déjà sur l'anneau sont prioritaires.", explanationAr: "عند مدخل المدار، الأسبقية للسيارات الموجودة داخله.",
    scene: { layout: "roundabout", signs: [{ icon: "/signs/regulatory--roundabout.svg", at: [4.6, 9] }], actors: [hero([1.5, 13], [1.5, 7.4], { brake: true }), { kind: "car", color: "#56b2a0", arc: { c: [0, 0], r: 4.9, a0: -1.25, a1: -0.1 } }] },
  },
  {
    id: "l3-giratoire-sortie", level: 3,
    title: "Sortir d'un giratoire", titleAr: "الخروج من المدار",
    situation: "Vous circulez sur l'anneau et votre sortie approche.", situationAr: "تسير داخل المدار واقترب مخرجك.",
    question: "Quel est le bon réflexe ?", questionAr: "ما التصرف الصحيح؟",
    choices: [{ fr: "Mettre le clignotant droit et serrer à droite", ar: "أشغل المؤشر الأيمن وأقترب من اليمين" }, { fr: "Sortir sans prévenir", ar: "أخرج دون إشارة" }, { fr: "Mettre le clignotant gauche", ar: "أشغل المؤشر الأيسر" }],
    answer: 0,
    explanation: "On annonce toujours sa sortie du giratoire avec le clignotant droit.", explanationAr: "يجب دائماً الإشارة إلى الخروج من المدار بالمؤشر الأيمن.",
    scene: { layout: "roundabout", actors: [{ kind: "car", color: HERO, hero: true, arc: { c: [0, 0], r: 4.9, a0: -0.2, a1: 1.15 } }, { kind: "car", color: "#eb9a58", from: [13, -1.5], to: [8.4, -1.5], brake: true }] },
  },
  {
    id: "l3-ambulance", level: 3,
    title: "Véhicule prioritaire", titleAr: "سيارة ذات أولوية",
    situation: "Une ambulance arrive derrière vous, sirène et gyrophare allumés.", situationAr: "سيارة إسعاف تقترب خلفك بصفارة وأضواء.",
    question: "Que devez-vous faire ?", questionAr: "ماذا يجب أن تفعل؟",
    choices: [{ fr: "Me ranger sur la droite et la laisser passer", ar: "أنزاح إلى اليمين وأتركها تمر" }, { fr: "Accélérer pour la devancer", ar: "أسرع لأسبقها" }, { fr: "Freiner brusquement au milieu de la voie", ar: "أفرمل فجأة وسط الطريق" }],
    answer: 0,
    explanation: "Face à un véhicule prioritaire en intervention, facilitez son passage en vous rangeant sans freinage brutal.", explanationAr: "أمام سيارة ذات أولوية في مهمة، سهّل مرورها بالانزياح دون فرملة مفاجئة.",
    scene: { layout: "straight", actors: [hero([1.5, 11], [2.9, 2.2]), { kind: "car", color: "#f2f5fb", siren: true, from: [1.5, 15], to: [1.0, 5.9] }] },
  },
  {
    id: "l3-tramway", level: 3,
    title: "Croisement d'un tramway", titleAr: "عبور الترامواي",
    situation: "Un tramway approche de la traversée au moment où vous allez franchir les rails.", situationAr: "ترامواي يقترب من المعبر لحظة اقترابك من السكة.",
    question: "Quelle est la bonne décision ?", questionAr: "ما القرار الصحيح؟",
    choices: [{ fr: "Lui céder le passage, il est prioritaire", ar: "أعطيه الأسبقية فهو صاحب الأولوية" }, { fr: "Passer vite devant lui", ar: "أمر بسرعة أمامه" }, { fr: "M'arrêter sur les rails", ar: "أتوقف فوق السكة" }],
    answer: 0,
    explanation: "Le tramway, qui ne peut pas s'écarter, est toujours prioritaire. Ne stationnez jamais sur les rails.", explanationAr: "الترامواي لا يستطيع الانحراف ولذلك له الأسبقية دائماً، ولا تتوقف فوق السكة أبداً.",
    scene: { layout: "cross", signs: [{ icon: "/signs/A9.svg", at: [4.6, 7.2] }], actors: [hero([1.5, 13], [1.5, 7.1], { brake: true }), { kind: "tram", color: "#4a6b9c", from: [-14, 0], to: [-1.5, 0] }] },
  },
  {
    id: "l3-voie-etroite", level: 3,
    title: "Passage étroit", titleAr: "ممر ضيق",
    situation: "Un rétrécissement ne laisse passer qu'un véhicule, une voiture arrive en face.", situationAr: "تضيق الطريق ولا تسمح بمرور سيارة واحدة فقط، وسيارة قادمة في الاتجاه المعاكس.",
    question: "Que dit le panneau B15 ?", questionAr: "ماذا تعني العلامة B15؟",
    choices: [{ fr: "Je cède le passage au véhicule venant en face", ar: "أعطي الأسبقية للسيارة القادمة أمامي" }, { fr: "J'ai la priorité, je passe", ar: "لي الأسبقية، أمر" }, { fr: "Chacun passe en même temps", ar: "يمر الجميع في نفس الوقت" }],
    answer: 0,
    explanation: "Le panneau « cédez le passage au sens inverse » impose d'attendre que la voie se libère.", explanationAr: "علامة «أعط الأسبقية للسير المقابل» تفرض الانتظار حتى يخلو الطريق.",
    scene: { layout: "straight", signs: [{ icon: "/signs/regulatory--give-way-to-oncoming-traffic.svg", at: [4.2, 8] }], actors: [hero([1.5, 12], [1.5, 5.4], { brake: true }), { kind: "truck", color: "#d7b45c", from: [-1.5, -12], to: [-1.3, 1.5] }] },
  },

  // ───────────────── Niveau 4 · Conduite & sécurité ─────────────────
  {
    id: "l4-vitesse", level: 4,
    title: "Zone limitée à 30", titleAr: "منطقة محددة بـ 30",
    situation: "Vous entrez dans une zone 30 près d'une école.", situationAr: "تدخل منطقة محددة بـ 30 كلم/س قرب مدرسة.",
    question: "Quelle vitesse respecter ?", questionAr: "ما السرعة الواجب احترامها؟",
    choices: [{ fr: "30 km/h au maximum", ar: "30 كلم/س كحد أقصى" }, { fr: "50 km/h si la rue est vide", ar: "50 كلم/س إذا كان الشارع فارغاً" }, { fr: "La même vitesse que les autres", ar: "نفس سرعة الآخرين" }],
    answer: 0,
    explanation: "La limitation s'applique en permanence, même lorsque la chaussée semble dégagée.", explanationAr: "تحديد السرعة ساري دائماً حتى لو بدا الطريق خالياً.",
    scene: { layout: "straight", signs: [{ icon: "/signs/regulatory--maximum-speed-limit-30.svg", at: [4.2, 8.4] }, { icon: "/signs/A13a.svg", at: [-4.2, 3], facing: 0 }], actors: [hero([1.5, 12], [1.5, 2.8]), { kind: "pedestrian", color: "#c4607b", from: [4.6, 1.5], to: [4.6, -3.5], t0: 0.3 }] },
  },
  {
    id: "l4-distance", level: 4,
    title: "Distance de sécurité", titleAr: "مسافة الأمان",
    situation: "La voiture devant vous freine brusquement.", situationAr: "السيارة أمامك تفرمل فجأة.",
    question: "Comment réagir en sécurité ?", questionAr: "كيف تتصرف بأمان؟",
    choices: [{ fr: "Ralentir et garder une distance suffisante", ar: "أخفف السرعة وأحافظ على مسافة كافية" }, { fr: "Rester très près d'elle", ar: "أبقى قريباً جداً منها" }, { fr: "Dépasser immédiatement", ar: "أتجاوزها فوراً" }],
    answer: 0,
    explanation: "Gardez au minimum deux secondes d'intervalle : c'est la distance qui permet de s'arrêter à temps.", explanationAr: "حافظ على فارق ثانيتين على الأقل، فهي المسافة التي تسمح بالتوقف في الوقت المناسب.",
    scene: { layout: "straight", signs: [{ icon: "/signs/warning--keep-distance.svg", at: [4.2, 8.4] }], actors: [hero([1.5, 12], [1.5, 6.6], { brake: true }), { kind: "car", color: "#eb9a58", from: [1.5, 6.6], to: [1.5, 2.0], brake: true }] },
  },
  {
    id: "l4-pluie", level: 4,
    title: "Chaussée glissante", titleAr: "طريق زلقة",
    situation: "Il pleut fortement et la route devient glissante.", situationAr: "تمطر بغزارة والطريق أصبحت زلقة.",
    question: "Quel comportement adopter ?", questionAr: "ما السلوك الصحيح؟",
    choices: [{ fr: "Réduire la vitesse et augmenter les distances", ar: "أخفض السرعة وأزيد المسافات" }, { fr: "Garder la même vitesse", ar: "أحافظ على نفس السرعة" }, { fr: "Freiner brusquement dans les virages", ar: "أفرمل فجأة في المنعرجات" }],
    answer: 0,
    explanation: "Sur sol mouillé la distance de freinage double : ralentissez et anticipez davantage.", explanationAr: "على الطريق المبللة تتضاعف مسافة التوقف، لذلك خفف السرعة وتوقع مبكراً.",
    scene: { layout: "straight", weather: "rain", signs: [{ icon: "/signs/A4.svg", at: [4.2, 8.4] }], actors: [hero([1.5, 12], [1.5, 4.2]), { kind: "car", color: "#7f93b5", from: [-1.5, -10], to: [-1.5, 6] }] },
  },
  {
    id: "l4-depassement", level: 4,
    title: "Dépassement interdit", titleAr: "ممنوع التجاوز",
    situation: "Un panneau d'interdiction de dépasser précède un virage sans visibilité.", situationAr: "علامة منع التجاوز تسبق منعرجاً بدون رؤية واضحة.",
    question: "Pouvez-vous dépasser ?", questionAr: "هل يمكنك التجاوز؟",
    choices: [{ fr: "Non, je reste derrière le véhicule", ar: "لا، أبقى خلف السيارة" }, { fr: "Oui, si la voie semble libre", ar: "نعم، إذا بدا الطريق خالياً" }, { fr: "Oui, en accélérant très fort", ar: "نعم، بالتسريع الشديد" }],
    answer: 0,
    explanation: "Le dépassement est interdit : la visibilité est insuffisante pour le réaliser sans danger.", explanationAr: "التجاوز ممنوع لأن مجال الرؤية غير كافٍ للقيام به بأمان.",
    scene: { layout: "straight", signs: [{ icon: "/signs/regulatory--no-overtaking.svg", at: [4.2, 8.4] }], actors: [hero([1.5, 12], [1.5, 7.9], { brake: true }), { kind: "truck", color: "#d7b45c", from: [1.5, 8.0], to: [1.5, 2.6] }, { kind: "car", color: "#56b2a0", from: [-1.5, -12], to: [-1.5, 1.5] }] },
  },
  {
    id: "l4-angle-mort", level: 4,
    title: "Cycliste dans l'angle mort", titleAr: "دراجة في النقطة العمياء",
    situation: "Vous allez tourner à droite, un cycliste longe votre véhicule.", situationAr: "تنوي الانعطاف يميناً، ودراجة تسير بمحاذاة سيارتك.",
    question: "Quel est le bon réflexe ?", questionAr: "ما التصرف الصحيح؟",
    choices: [{ fr: "Contrôler l'angle mort avant de tourner", ar: "أتحقق من النقطة العمياء قبل الانعطاف" }, { fr: "Tourner, il me verra", ar: "أنعطف، فهو سيراني" }, { fr: "Accélérer pour passer avant lui", ar: "أسرع لأمر قبله" }],
    answer: 0,
    explanation: "Avant toute manœuvre, un contrôle des rétroviseurs et de l'angle mort est indispensable.", explanationAr: "قبل أي مناورة يجب التحقق من المرايا والنقطة العمياء.",
    scene: { layout: "cross", signs: [{ icon: "/signs/A21.svg", at: [-4.4, 6.4] }], actors: [hero([1.5, 12], [1.5, 6.7], { brake: true }), { kind: "bike", color: "#4eac86", from: [3.0, 11], to: [3.0, 3.4] }] },
  },
  {
    id: "l4-brouillard", level: 4,
    title: "Visibilité réduite", titleAr: "رؤية محدودة",
    situation: "Un brouillard dense réduit fortement la visibilité.", situationAr: "ضباب كثيف يقلل الرؤية بشكل كبير.",
    question: "Que faites-vous ?", questionAr: "ماذا تفعل؟",
    choices: [{ fr: "Ralentir et allumer les feux de brouillard", ar: "أخفف السرعة وأشعل أضواء الضباب" }, { fr: "Allumer les pleins phares", ar: "أشعل الأضواء العالية" }, { fr: "Suivre de près la voiture devant", ar: "ألتصق بالسيارة التي أمامي" }],
    answer: 0,
    explanation: "Dans le brouillard, les pleins phares éblouissent : utilisez les feux de croisement et de brouillard en ralentissant.", explanationAr: "في الضباب تسبب الأضواء العالية الانبهار، استعمل أضواء التقاطع والضباب مع تخفيف السرعة.",
    scene: { layout: "straight", weather: "fog", signs: [{ icon: "/signs/warning--foggy-road.svg", at: [4.2, 8.4] }], actors: [hero([1.5, 12], [1.5, 5]), { kind: "car", color: "#9aa7bd", from: [1.5, 3], to: [1.5, -2] }] },
  },

  // ───────────────── Niveau 5 · Manœuvres & stationnement ─────────────────
  {
    id: "l5-stationnement", level: 5,
    title: "Stationnement interdit", titleAr: "الوقوف ممنوع",
    situation: "Vous souhaitez vous garer devant un panneau d'interdiction de stationner.", situationAr: "تريد الوقوف أمام علامة منع الوقوف.",
    question: "Que faites-vous ?", questionAr: "ماذا تفعل؟",
    choices: [{ fr: "Chercher une place autorisée plus loin", ar: "أبحث عن مكان مسموح أبعد" }, { fr: "Me garer quelques minutes", ar: "أقف بضع دقائق" }, { fr: "Me garer en double file", ar: "أقف في الصف الثاني" }],
    answer: 0,
    explanation: "Le stationnement interdit l'est en permanence : cherchez un emplacement autorisé.", explanationAr: "منع الوقوف ساري في كل الأوقات، ابحث عن مكان مسموح به.",
    scene: { layout: "parking", signs: [{ icon: "/signs/regulatory--no-parking.svg", at: [4.6, 5.6] }], actors: [hero([1.5, 12], [1.5, 4.4], { brake: true }), { kind: "car", color: "#9aa7bd", from: [5.6, 0.6], to: [5.6, 0.6], face: 0 }, { kind: "car", color: "#c0cbdd", from: [5.6, -3.4], to: [5.6, -3.4], face: 0 }] },
  },
  {
    id: "l5-sortie-stationnement", level: 5,
    title: "Sortir d'une place", titleAr: "الخروج من موقف",
    situation: "Vous quittez votre place de stationnement, une voiture arrive sur la chaussée.", situationAr: "تغادر مكان وقوفك، وسيارة قادمة في الطريق.",
    question: "Qui est prioritaire ?", questionAr: "لمن الأسبقية؟",
    choices: [{ fr: "La voiture déjà sur la chaussée", ar: "السيارة الموجودة في الطريق" }, { fr: "Moi, je sors en premier", ar: "أنا، أخرج أولاً" }, { fr: "Celui qui klaxonne le premier", ar: "من ينبه أولاً" }],
    answer: 0,
    explanation: "En quittant un stationnement vous êtes non prioritaire : laissez passer la circulation.", explanationAr: "عند مغادرة الوقوف ليست لك الأسبقية، اترك حركة السير تمر.",
    scene: { layout: "parking", actors: [hero([5.6, 2.6], [4.2, 2.2], { brake: true }), { kind: "car", color: "#eb9a58", from: [1.5, 12], to: [1.5, 1.2] }] },
  },
  {
    id: "l5-demi-tour", level: 5,
    title: "Demi-tour interdit", titleAr: "ممنوع الدوران",
    situation: "Vous vous êtes trompé de direction, un panneau interdit le demi-tour.", situationAr: "أخطأت الاتجاه، وعلامة تمنع الدوران إلى الخلف.",
    question: "Quelle est la bonne solution ?", questionAr: "ما الحل الصحيح؟",
    choices: [{ fr: "Continuer et faire demi-tour là où c'est autorisé", ar: "أواصل وأدور حيث يُسمح بذلك" }, { fr: "Faire demi-tour rapidement", ar: "أدور بسرعة" }, { fr: "Reculer jusqu'au carrefour", ar: "أرجع إلى الوراء حتى التقاطع" }],
    answer: 0,
    explanation: "Un demi-tour interdit reste interdit : poursuivez jusqu'à un endroit autorisé et sûr.", explanationAr: "الدوران الممنوع يبقى ممنوعاً، واصل حتى مكان مسموح وآمن.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--no-u-turn.svg", at: [4.4, 5.6] }], actors: [hero([1.5, 12], [1.5, 6.9], { brake: true }), { kind: "car", color: "#56b2a0", from: [-1.5, -12], to: [-1.5, 4] }] },
  },
  {
    id: "l5-insertion", level: 5,
    title: "Insertion sur autoroute", titleAr: "الاندماج في الطريق السيار",
    situation: "Vous arrivez sur la voie d'accélération d'une autoroute.", situationAr: "تصل إلى مسار التسريع في الطريق السيار.",
    question: "Comment vous insérer ?", questionAr: "كيف تندمج؟",
    choices: [{ fr: "Accélérer et m'insérer dans un espace libre", ar: "أسرع وأندمج في فراغ مناسب" }, { fr: "M'arrêter en bout de voie", ar: "أتوقف في نهاية المسار" }, { fr: "M'insérer sans regarder", ar: "أندمج دون النظر" }],
    answer: 0,
    explanation: "La voie d'accélération sert à atteindre la vitesse du trafic avant de s'insérer dans un espace suffisant.", explanationAr: "مسار التسريع يستعمل لبلوغ سرعة السير قبل الاندماج في فراغ كافٍ.",
    scene: { layout: "dual", signs: [{ icon: "/signs/information--motorway.svg", at: [7.8, 9.5] }], actors: [hero([5.8, 12], [5.0, 2.4]), { kind: "car", color: "#eb9a58", from: [3.2, 11], to: [3.2, -1.5] }, { kind: "truck", color: "#d7b45c", from: [3.2, 16], to: [3.2, 5.5] }] },
  },
  {
    id: "l5-bus", level: 5,
    title: "Bus à l'arrêt", titleAr: "حافلة متوقفة",
    situation: "Un bus scolaire est arrêté et des enfants en descendent.", situationAr: "حافلة مدرسية متوقفة وينزل منها أطفال.",
    question: "Quelle attitude adopter ?", questionAr: "ما التصرف الصحيح؟",
    choices: [{ fr: "Ralentir fortement et être prêt à m'arrêter", ar: "أخفف السرعة بقوة وأستعد للتوقف" }, { fr: "Dépasser le bus normalement", ar: "أتجاوز الحافلة بشكل عادي" }, { fr: "Klaxonner pour avertir", ar: "أنبه بالمنبه" }],
    answer: 0,
    explanation: "Des enfants peuvent surgir devant ou derrière le bus : ralentissez fortement et restez prêt à stopper.", explanationAr: "قد يظهر الأطفال أمام الحافلة أو خلفها، لذا خفف السرعة بقوة وكن مستعداً للتوقف.",
    scene: { layout: "straight", signs: [{ icon: "/signs/A13a.svg", at: [4.2, 8.4] }], actors: [hero([1.5, 12], [1.5, 9.2], { brake: true }), { kind: "bus", color: "#f0b24a", from: [1.5, 2.5], to: [1.5, 2.5], face: 0 }, { kind: "pedestrian", color: "#c4607b", from: [3.1, 1.4], to: [4.6, 1.4], t0: 0.3 }] },
  },
];

export const scenariosByLevel = (level: number) => scenarios.filter(s => s.level === level);

/* ════════════════════════════════════════════════════════════════════════
   NIVEAU 6 · ORDRE DE PASSAGE (priority scenarios from the training book)

   Every vehicle approaches, halts at the intersection (phase 1), the scene
   freezes for the question, then the correct crossing order is replayed
   (phase 2). Turning paths are real filleted curves: a right turn uses a
   tight radius, a left turn swings wide across the junction.
   ════════════════════════════════════════════════════════════════════════ */

const mv = (path: Vec2[], t0: number, t1: number, r = 2.2, ease: Ease = "inout"): Move => ({ path, t0, t1, r, ease });
const arrive = (path: Vec2[], r = 2.2): Move => mv(path, 0, 0.3, r, "out");

// Approach lanes (right-hand traffic) and the three exits from each branch.
const S_IN: Vec2[] = [[1.5, 15], [1.5, 5.2]];
const S_GO: Vec2[] = [[1.5, 5.2], [1.5, -15]];
const S_RIGHT: Vec2[] = [[1.5, 5.2], [1.5, 1.5], [15, 1.5]];
const S_LEFT: Vec2[] = [[1.5, 5.2], [1.5, -1.5], [-15, -1.5]];

const E_IN: Vec2[] = [[15, -1.5], [5.2, -1.5]];
const E_GO: Vec2[] = [[5.2, -1.5], [-15, -1.5]];
const E_RIGHT: Vec2[] = [[5.2, -1.5], [1.5, -1.5], [1.5, -15]];
const E_LEFT: Vec2[] = [[5.2, -1.5], [-1.5, -1.5], [-1.5, 15]];

const W_IN: Vec2[] = [[-15, 1.5], [-5.2, 1.5]];
const W_GO: Vec2[] = [[-5.2, 1.5], [15, 1.5]];
const W_RIGHT: Vec2[] = [[-5.2, 1.5], [-1.5, 1.5], [-1.5, 15]];
const W_LEFT: Vec2[] = [[-5.2, 1.5], [1.5, 1.5], [1.5, -15]];

const N_IN: Vec2[] = [[-1.5, -15], [-1.5, -5.2]];
const N_GO: Vec2[] = [[-1.5, -5.2], [-1.5, 15]];
const N_RIGHT: Vec2[] = [[-1.5, -5.2], [-1.5, -1.5], [-15, -1.5]];
const N_LEFT: Vec2[] = [[-1.5, -5.2], [-1.5, 1.5], [15, 1.5]];

const TIGHT = 1.5;   // right-turn radius
const WIDE = 3.4;    // left-turn radius

const C_A = "#6a63ef", C_B = "#eb9a58", C_C = "#56b2a0", C_D = "#e8705f";
const heroCar = (moves: Move[]): Actor => ({ kind: "car", color: C_A, label: "A", hero: true, moves });
const other = (color: string, label: string, moves: Move[], kind: ActorKind = "car"): Actor => ({ kind, color, label, moves });

const ORDER = (first: string, second: string, third?: string) =>
  third ? `${first} puis ${second} puis ${third}` : `${first} puis ${second}`;
const ORDER_AR = (first: string, second: string, third?: string) =>
  third ? `${first} ثم ${second} ثم ${third}` : `${first} ثم ${second}`;

const priorityScenarios: Scenario[] = [
  {
    id: "p-droite-2", level: 6, pauseAt: 0.34, duration: 7600,
    title: "Priorité à droite", titleAr: "الأسبقية لليمين",
    situation: "Carrefour sans signalisation. Vous (A) allez tout droit, le véhicule B arrive sur votre droite.", situationAr: "تقاطع بدون علامات. أنت (A) تسير مستقيماً، والمركبة B قادمة من يمينك.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "Les deux en même temps", ar: "كلاهما في نفس الوقت" }],
    answer: 0,
    explanation: "Sans panneau ni feu, la priorité revient au véhicule venant de la droite : B passe avant A.", explanationAr: "بدون علامة أو إشارة ضوئية، الأسبقية للمركبة القادمة من اليمين: B تمر قبل A.",
    scene: { layout: "cross", actors: [heroCar([arrive(S_IN), mv(S_GO, 0.62, 0.9)]), other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.4, 0.68)])] },
  },
  {
    id: "p-droite-gauche", level: 6, pauseAt: 0.34, duration: 7600,
    title: "Le véhicule vient de ma gauche", titleAr: "المركبة قادمة من يساري",
    situation: "Carrefour sans signalisation. Vous (A) allez tout droit, le véhicule B arrive sur votre gauche.", situationAr: "تقاطع بدون علامات. أنت (A) تسير مستقيماً، والمركبة B قادمة من يسارك.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: "B est toujours prioritaire", ar: "B لها الأسبقية دائماً" }],
    answer: 0,
    explanation: "B vient de votre gauche : c'est lui qui doit vous céder le passage. A passe en premier.", explanationAr: "B قادمة من يسارك، لذلك عليها إعطاؤك الأسبقية. A تمر أولاً.",
    scene: { layout: "cross", actors: [heroCar([arrive(S_IN), mv(S_GO, 0.4, 0.68)]), other(C_B, "B", [arrive(W_IN), mv(W_GO, 0.62, 0.9)])] },
  },
  {
    id: "p-droite-3", level: 6, pauseAt: 0.34, duration: 9200,
    title: "Trois véhicules, priorité à droite", titleAr: "ثلاث مركبات والأسبقية لليمين",
    situation: "Trois véhicules arrivent ensemble à un carrefour sans signalisation : A (vous) du sud, B de l'est, C de l'ouest. Tous vont tout droit.", situationAr: "ثلاث مركبات تصل معاً إلى تقاطع بدون علامات: A (أنت) من الجنوب، B من الشرق، C من الغرب. كلها تسير مستقيماً.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A", "C"), ar: ORDER_AR("B", "A", "C") }, { fr: ORDER("A", "B", "C"), ar: ORDER_AR("A", "B", "C") }, { fr: ORDER("C", "B", "A"), ar: ORDER_AR("C", "B", "A") }],
    answer: 0,
    explanation: "B n'a personne à sa droite : il part. A a B à sa droite, donc A suit. C a A à sa droite et passe en dernier.", explanationAr: "B لا أحد على يمينها فتنطلق أولاً. A لديها B على يمينها فتتبعها. C لديها A على يمينها فتمر أخيراً.",
    scene: { layout: "cross", actors: [heroCar([arrive(S_IN), mv(S_GO, 0.58, 0.78)]), other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.38, 0.58)]), other(C_C, "C", [arrive(W_IN), mv(W_GO, 0.78, 1)])] },
  },
  {
    id: "p-blocage-4", level: 6, pauseAt: 0.36, duration: 10500,
    title: "Carrefour bloqué", titleAr: "تقاطع مسدود",
    situation: "Quatre véhicules arrivent en même temps à un carrefour sans signalisation. Chacun a quelqu'un sur sa droite.", situationAr: "أربع مركبات تصل في نفس الوقت إلى تقاطع بدون علامات، ولكل واحدة مركبة على يمينها.",
    question: "Comment se règle la situation ?", questionAr: "كيف تُحل هذه الوضعية؟",
    choices: [{ fr: "Aucun n'est prioritaire : les conducteurs s'entendent et dégagent un par un", ar: "لا أحد له الأسبقية: يتفاهم السائقون ويمرون واحداً تلو الآخر" }, { fr: "Le plus rapide passe en premier", ar: "الأسرع يمر أولاً" }, { fr: "Le plus gros véhicule est prioritaire", ar: "المركبة الأكبر لها الأسبقية" }],
    answer: 0,
    explanation: "C'est le blocage classique : la règle de la priorité à droite ne peut pas se dénouer seule. Les conducteurs se font signe et libèrent le carrefour un par un, en commençant par celui qui tourne à droite.", explanationAr: "هذا هو الانسداد المعروف: قاعدة الأسبقية لليمين لا تحل الوضع وحدها. يتفاهم السائقون ويخلون التقاطع واحداً تلو الآخر، بدءاً بمن ينعطف يميناً.",
    scene: { layout: "cross", actors: [heroCar([arrive(S_IN), mv(S_RIGHT, 0.42, 0.6, TIGHT)]), other(C_B, "B", [arrive(E_IN), mv(E_RIGHT, 0.58, 0.74, TIGHT)]), other(C_C, "C", [arrive(N_IN), mv(N_RIGHT, 0.72, 0.88, TIGHT)]), other(C_D, "D", [arrive(W_IN), mv(W_RIGHT, 0.86, 1, TIGHT)])] },
  },
  {
    id: "p-stop-prioritaire", level: 6, pauseAt: 0.34, duration: 7800,
    title: "STOP face à une route prioritaire", titleAr: "قف أمام طريق ذات أسبقية",
    situation: "Vous (A) arrivez à un panneau STOP. Le véhicule B circule sur la route prioritaire.", situationAr: "أنت (A) تصل إلى علامة قف، والمركبة B تسير في الطريق ذات الأسبقية.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "A passe car il est arrivé le premier", ar: "A تمر لأنها وصلت أولاً" }],
    answer: 0,
    explanation: "Le STOP impose l'arrêt complet puis la priorité à tous les véhicules de la route croisée, quel que soit l'ordre d'arrivée.", explanationAr: "علامة قف تفرض التوقف التام ثم إعطاء الأسبقية لكل مركبات الطريق المتقاطع مهما كان ترتيب الوصول.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--stop.svg", at: [4.4, 5.4] }, { icon: "/signs/regulatory--priority-road.svg", at: [-4.6, -5.2] }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.62, 0.9)]), other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.4, 0.68)])] },
  },
  {
    id: "p-cedez-passage", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Cédez le passage", titleAr: "أعط الأسبقية",
    situation: "Vous (A) abordez un panneau « cédez le passage ». Le véhicule B circule sur la route principale.", situationAr: "أنت (A) تقترب من علامة «أعط الأسبقية»، والمركبة B تسير في الطريق الرئيسي.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "A doit s'arrêter complètement puis passer avant B", ar: "A تتوقف تماماً ثم تمر قبل B" }],
    answer: 0,
    explanation: "« Cédez le passage » n'impose pas l'arrêt, mais oblige à laisser passer les véhicules de la route principale : B d'abord.", explanationAr: "«أعط الأسبقية» لا تفرض التوقف لكنها تلزم بترك مركبات الطريق الرئيسي تمر: B أولاً.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--yield.svg", at: [4.4, 5.6] }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.62, 0.9)]), other(C_B, "B", [arrive(W_IN), mv(W_GO, 0.4, 0.68)])] },
  },
  {
    id: "p-stop-double", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Deux STOP face à face", titleAr: "علامتا قف متقابلتان",
    situation: "Vous (A) et le véhicule B êtes tous les deux à un STOP. B se trouve sur votre droite.", situationAr: "أنت (A) والمركبة B كلاكما عند علامة قف، وB على يمينك.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "Celui qui redémarre le premier", ar: "من ينطلق أولاً" }],
    answer: 0,
    explanation: "Quand deux véhicules sont soumis au même panneau, on applique de nouveau la priorité à droite : B passe avant A.", explanationAr: "عندما تخضع مركبتان لنفس العلامة، تطبق من جديد قاعدة الأسبقية لليمين: B تمر قبل A.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--stop.svg", at: [4.4, 5.4] }, { icon: "/signs/regulatory--stop.svg", at: [6.1, -4.3], facing: 1.57 }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.62, 0.9)]), other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.4, 0.68)])] },
  },
  {
    id: "p-route-prioritaire", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Je suis sur la route prioritaire", titleAr: "أنا في الطريق ذات الأسبقية",
    situation: "Vous (A) roulez sur une route prioritaire. Le véhicule B attend sur la route latérale.", situationAr: "أنت (A) تسير في طريق ذات أسبقية، والمركبة B تنتظر في الطريق الجانبي.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: "B passe car il vient de la droite", ar: "B تمر لأنها قادمة من اليمين" }],
    answer: 0,
    explanation: "Le panneau de route prioritaire annule la priorité à droite : vous gardez le passage, tout en restant vigilant.", explanationAr: "علامة الطريق ذات الأسبقية تلغي قاعدة الأسبقية لليمين: تحتفظ بحق المرور مع البقاء حذراً.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--priority-road.svg", at: [4.4, 6.4] }, { icon: "/signs/regulatory--yield.svg", at: [6.2, -4.3], facing: 1.57 }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.4, 0.68)]), other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.62, 0.9)])] },
  },
  {
    id: "p-tourne-gauche-face", level: 6, pauseAt: 0.34, duration: 8600,
    title: "Tourner à gauche devant un véhicule", titleAr: "الانعطاف يساراً أمام مركبة",
    situation: "Le feu est vert. Vous (A) voulez tourner à gauche, le véhicule B arrive en face et continue tout droit.", situationAr: "الإشارة خضراء. أنت (A) تريد الانعطاف يساراً، والمركبة B قادمة من الأمام وتواصل مستقيماً.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "A passe car il a le feu vert", ar: "A تمر لأن الإشارة خضراء لها" }],
    answer: 0,
    explanation: "Le feu vert ne donne pas la priorité sur les véhicules venant en face. En tournant à gauche vous devez les laisser passer.", explanationAr: "الضوء الأخضر لا يمنح الأسبقية على المركبات القادمة من الأمام. عند الانعطاف يساراً يجب تركها تمر.",
    scene: { layout: "cross", lights: [{ at: [4.2, 4.4], state: "green" }], actors: [heroCar([arrive([[1.5, 15], [1.5, 3.2]]), mv([[1.5, 3.2], [1.5, -1.5], [-15, -1.5]], 0.64, 0.95, WIDE)]), other(C_B, "B", [arrive(N_IN), mv(N_GO, 0.4, 0.66)])] },
  },
  {
    id: "p-tourne-droite-pieton", level: 6, pauseAt: 0.34, duration: 8200,
    title: "Tourner à droite, un piéton traverse", titleAr: "الانعطاف يميناً وراجل يعبر",
    situation: "Vous (A) tournez à droite au feu vert. Un piéton (P) s'engage sur le passage de la rue où vous entrez.", situationAr: "أنت (A) تنعطف يميناً والإشارة خضراء. راجل (P) يبدأ العبور في الشارع الذي تدخله.",
    question: "Qui passe en premier ?", questionAr: "من يمر أولاً؟",
    choices: [{ fr: "Le piéton, je m'arrête et je le laisse traverser", ar: "الراجل، أتوقف وأتركه يعبر" }, { fr: "Moi, car j'ai le feu vert", ar: "أنا، لأن الإشارة خضراء" }, { fr: "Le premier arrivé sur le passage", ar: "من يصل الممر أولاً" }],
    answer: 0,
    explanation: "Même au feu vert, le piéton engagé sur le passage de la voie que vous abordez reste prioritaire.", explanationAr: "حتى مع الضوء الأخضر، الراجل الذي بدأ العبور في الطريق التي تدخلها له الأسبقية.",
    scene: { layout: "cross", crosswalk: true, lights: [{ at: [4.2, 4.4], state: "green" }], actors: [heroCar([arrive([[1.5, 15], [1.5, 5.4]]), mv(S_RIGHT, 0.66, 0.95, TIGHT)]), { kind: "pedestrian", color: "#c4607b", label: "P", moves: [mv([[6.4, 4.4], [6.4, 4.4]], 0, 0.3), mv([[6.4, 4.4], [6.4, -1.2]], 0.38, 0.64, 0.5, "linear")] }] },
  },
  {
    id: "p-feu-clignotant", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Feu orange clignotant", titleAr: "ضوء برتقالي وامض",
    situation: "Le feu orange clignote : il ne règle plus la circulation. Le véhicule B arrive sur votre droite.", situationAr: "الضوء البرتقالي يومض ولم يعد ينظم السير، والمركبة B قادمة من يمينك.",
    question: "Quelle règle s'applique ?", questionAr: "ما القاعدة المطبقة؟",
    choices: [{ fr: "La priorité à droite : B passe avant A", ar: "الأسبقية لليمين: B تمر قبل A" }, { fr: "Le feu reste vert pour tous", ar: "الإشارة تبقى خضراء للجميع" }, { fr: "A passe car il va tout droit", ar: "A تمر لأنها تسير مستقيماً" }],
    answer: 0,
    explanation: "Un feu orange clignotant signifie que le carrefour n'est plus réglé par les feux : on revient aux panneaux, sinon à la priorité à droite.", explanationAr: "الضوء البرتقالي الوامض يعني أن التقاطع لم يعد منظماً بالإشارات: نعود إلى العلامات وإلا فإلى الأسبقية لليمين.",
    scene: { layout: "cross", lights: [{ at: [4.2, 4.4], state: "orange" }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.62, 0.9)]), other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.4, 0.68)])] },
  },
  {
    id: "p-giratoire-ordre", level: 6, pauseAt: 0.34, duration: 8800,
    title: "Ordre de passage au giratoire", titleAr: "ترتيب المرور في المدار",
    situation: "Vous (A) arrivez à l'entrée d'un giratoire. Les véhicules B et C circulent déjà sur l'anneau.", situationAr: "أنت (A) تصل إلى مدخل المدار، والمركبتان B وC تدوران داخله.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "C", "A"), ar: ORDER_AR("B", "C", "A") }, { fr: ORDER("A", "B", "C"), ar: ORDER_AR("A", "B", "C") }, { fr: ORDER("A", "C", "B"), ar: ORDER_AR("A", "C", "B") }],
    answer: 0,
    explanation: "Les véhicules déjà engagés sur l'anneau sont prioritaires. Vous entrez seulement quand l'anneau est libre.", explanationAr: "المركبات الموجودة داخل المدار لها الأسبقية، وتدخل أنت فقط عندما يخلو المدار.",
    scene: { layout: "roundabout", signs: [{ icon: "/signs/regulatory--roundabout.svg", at: [4.8, 9.2] }], actors: [heroCar([arrive([[1.5, 15], [1.5, 8.2]]), mv([[1.5, 8.2], [1.5, 6.4]], 0.8, 1)]), { kind: "car", color: C_B, label: "B", arc: { c: [0, 0], r: 4.9, a0: -1.5, a1: -0.15 }, t0: 0.38, t1: 0.64 }, { kind: "car", color: C_C, label: "C", arc: { c: [0, 0], r: 4.9, a0: -2.4, a1: -1.1 }, t0: 0.6, t1: 0.85 }] },
  },
  {
    id: "p-ambulance", level: 6, pauseAt: 0.34, duration: 8200,
    title: "Ambulance en intervention", titleAr: "سيارة إسعاف في مهمة",
    situation: "Vous (A) êtes arrêté au feu rouge. Une ambulance (U) arrive derrière vous, sirène et gyrophare en marche.", situationAr: "أنت (A) متوقف عند الضوء الأحمر، وسيارة إسعاف (U) تقترب خلفك بصفارة وأضواء.",
    question: "Que faites-vous ?", questionAr: "ماذا تفعل؟",
    choices: [{ fr: "Me décaler prudemment pour la laisser passer", ar: "أنزاح بحذر لأتركها تمر" }, { fr: "Rester immobile au feu rouge", ar: "أبقى ثابتاً عند الضوء الأحمر" }, { fr: "Franchir le feu rouge à pleine vitesse", ar: "أتجاوز الضوء الأحمر بسرعة" }],
    answer: 0,
    explanation: "Un véhicule prioritaire en intervention passe avant tout le monde. Dégagez-lui le passage prudemment, sans vous mettre en danger.", explanationAr: "المركبة ذات الأولوية في مهمة تمر قبل الجميع. أفسح لها الطريق بحذر دون تعريض نفسك للخطر.",
    scene: { layout: "cross", lights: [{ at: [4.2, 4.4], state: "red" }], actors: [heroCar([arrive([[1.5, 15], [1.5, 5.6]]), mv([[1.5, 5.6], [2.9, 4.6]], 0.4, 0.58, 1.2)]), { kind: "car", color: "#f2f5fb", label: "U", siren: true, moves: [arrive([[1.5, 19], [1.5, 10]]), mv([[1.5, 10], [0.7, 4], [0.7, -15]], 0.56, 0.92, 2.6)] }] },
  },
  {
    id: "p-pompiers", level: 6, pauseAt: 0.34, duration: 8400,
    title: "Camion de pompiers au carrefour", titleAr: "شاحنة إطفاء في التقاطع",
    situation: "Vous (A) avez la route prioritaire, mais un camion de pompiers (U) traverse le carrefour en intervention.", situationAr: "أنت (A) في طريق ذات أسبقية، لكن شاحنة إطفاء (U) تعبر التقاطع في مهمة.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("U", "A"), ar: ORDER_AR("U", "A") }, { fr: ORDER("A", "U"), ar: ORDER_AR("A", "U") }, { fr: "A passe car il est sur la route prioritaire", ar: "A تمر لأنها في الطريق ذات الأسبقية" }],
    answer: 0,
    explanation: "Les véhicules d'intervention priment sur toute autre règle, y compris sur la route prioritaire et les feux.", explanationAr: "مركبات التدخل لها الأولوية على كل القواعد الأخرى، بما في ذلك الطريق ذات الأسبقية والإشارات الضوئية.",
    scene: { layout: "cross", signs: [{ icon: "/signs/regulatory--priority-road.svg", at: [4.4, 6.4] }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.66, 0.95)]), other("#e05a4f", "U", [arrive(E_IN), mv(E_GO, 0.38, 0.66)], "truck")] },
  },
  {
    id: "p-tram-priorite", level: 6, pauseAt: 0.34, duration: 8200,
    title: "Le tramway au carrefour", titleAr: "الترامواي في التقاطع",
    situation: "Vous (A) arrivez au carrefour en même temps qu'un tramway (T) qui circule sur sa plateforme.", situationAr: "أنت (A) تصل إلى التقاطع في نفس وقت ترامواي (T) يسير على مساره.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("T", "A"), ar: ORDER_AR("T", "A") }, { fr: ORDER("A", "T"), ar: ORDER_AR("A", "T") }, { fr: "Celui qui arrive le premier", ar: "من يصل أولاً" }],
    answer: 0,
    explanation: "Le tramway circule sur rails et ne peut pas s'écarter : il reste prioritaire, et on ne s'arrête jamais sur la plateforme.", explanationAr: "الترامواي يسير على سكة ولا يستطيع الانحراف، لذلك له الأسبقية، ولا يجوز التوقف فوق مساره أبداً.",
    scene: { layout: "cross", signs: [{ icon: "/signs/A9.svg", at: [4.6, 7.2] }], actors: [heroCar([arrive(S_IN), mv(S_GO, 0.64, 0.95)]), other("#4a6b9c", "T", [arrive([[-17, 0], [-7.5, 0]]), mv([[-7.5, 0], [15, 0]], 0.38, 0.68)], "tram")] },
  },
  {
    id: "p-train", level: 6, pauseAt: 0.34, duration: 8600,
    title: "Passage à niveau", titleAr: "ممر السكة الحديدية",
    situation: "Vous (A) approchez d'un passage à niveau, un train (T) arrive.", situationAr: "أنت (A) تقترب من ممر سكة حديدية، وقطار (T) قادم.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: "Le train : je m'arrête avant la voie", ar: "القطار: أتوقف قبل السكة" }, { fr: "Moi, si je passe rapidement", ar: "أنا، إذا مررت بسرعة" }, { fr: "Celui qui arrive le premier", ar: "من يصل أولاً" }],
    answer: 0,
    explanation: "Le train a une priorité absolue : il ne peut ni freiner ni dévier. On s'arrête avant la voie et on ne s'y engage jamais sans être sûr de la dégager.", explanationAr: "للقطار أولوية مطلقة لأنه لا يستطيع الفرملة أو الانحراف. توقف قبل السكة ولا تدخلها أبداً دون التأكد من إخلائها.",
    scene: { layout: "rail", signs: [{ icon: "/signs/A7.svg", at: [4.4, 6.6] }], actors: [heroCar([arrive([[1.5, 15], [1.5, 5.4]]), mv([[1.5, 5.4], [1.5, -15]], 0.72, 1)]), other("#55617a", "T", [arrive([[-22, 0], [-13, 0]]), mv([[-13, 0], [20, 0]], 0.36, 0.68, 2, "linear")], "train")] },
  },
  {
    id: "p-retrecissement-priorite", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Passage étroit : j'ai la priorité", titleAr: "ممر ضيق: لي الأسبقية",
    situation: "Un rétrécissement ne laisse passer qu'un véhicule. Vous (A) avez le panneau de priorité sur la circulation en sens inverse.", situationAr: "تضيق الطريق ولا تسمح بمرور سوى مركبة واحدة. أنت (A) لديك علامة الأسبقية على السير المقابل.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: "Les deux se croisent lentement", ar: "يتقاطعان ببطء" }],
    answer: 0,
    explanation: "Le panneau C18 vous donne la priorité sur les véhicules venant en face : vous passez d'abord, B attend.", explanationAr: "العلامة C18 تمنحك الأسبقية على المركبات القادمة من الأمام: تمر أولاً وتنتظر B.",
    scene: { layout: "straight", signs: [{ icon: "/signs/regulatory--priority-over-oncoming-vehicles.svg", at: [4.2, 8.2] }], actors: [heroCar([arrive([[1.5, 14], [1.5, 7]]), mv([[1.5, 7], [1.5, -14]], 0.4, 0.72)]), other(C_B, "B", [arrive([[-1.5, -14], [-1.5, -6.5]]), mv([[-1.5, -6.5], [-1.5, 14]], 0.74, 1)])] },
  },
  {
    id: "p-retrecissement-cede", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Passage étroit : je cède", titleAr: "ممر ضيق: أعطي الأسبقية",
    situation: "Même rétrécissement, mais cette fois vous (A) avez le panneau « cédez le passage au sens inverse ».", situationAr: "نفس الممر الضيق، لكن هذه المرة لديك (A) علامة «أعط الأسبقية للسير المقابل».",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "A passe car il est le plus proche", ar: "A تمر لأنها الأقرب" }],
    answer: 0,
    explanation: "Le panneau B15 impose d'attendre que les véhicules venant en face aient franchi le rétrécissement.", explanationAr: "العلامة B15 تفرض الانتظار حتى تجتاز المركبات القادمة من الأمام الممر الضيق.",
    scene: { layout: "straight", signs: [{ icon: "/signs/regulatory--give-way-to-oncoming-traffic.svg", at: [4.2, 8.2] }], actors: [heroCar([arrive([[1.5, 14], [1.5, 7]]), mv([[1.5, 7], [1.5, -14]], 0.74, 1)]), other(C_B, "B", [arrive([[-1.5, -14], [-1.5, -6.5]]), mv([[-1.5, -6.5], [-1.5, 14]], 0.4, 0.72)])] },
  },
  {
    id: "p-sortie-parking", level: 6, pauseAt: 0.34, duration: 7600,
    title: "Sortie de stationnement", titleAr: "الخروج من الوقوف",
    situation: "Vous (A) quittez votre place de stationnement, le véhicule B circule déjà sur la chaussée.", situationAr: "أنت (A) تغادر مكان وقوفك، والمركبة B تسير في الطريق.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "A passe en mettant son clignotant", ar: "A تمر بتشغيل المؤشر" }],
    answer: 0,
    explanation: "En quittant un stationnement vous n'êtes jamais prioritaire : le clignotant n'autorise pas la manœuvre, il l'annonce.", explanationAr: "عند مغادرة الوقوف ليست لك الأسبقية أبداً: المؤشر لا يمنح الحق في المناورة بل يعلن عنها فقط.",
    scene: { layout: "parking", actors: [heroCar([arrive([[5.6, 2.6], [4.4, 2.4]], 1.2), mv([[4.4, 2.4], [1.5, 0.5], [1.5, -14]], 0.66, 1, 2.4)]), other(C_B, "B", [arrive([[1.5, 14], [1.5, 6.4]]), mv([[1.5, 6.4], [1.5, -14]], 0.38, 0.64)])] },
  },
  {
    id: "p-bus-arret", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Le bus quitte son arrêt", titleAr: "الحافلة تغادر محطتها",
    situation: "En agglomération, un bus (B) signale son intention de quitter son arrêt alors que vous (A) arrivez derrière lui.", situationAr: "داخل المدينة، تشير حافلة (B) إلى نيتها مغادرة المحطة بينما تصل أنت (A) خلفها.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("B", "A"), ar: ORDER_AR("B", "A") }, { fr: ORDER("A", "B"), ar: ORDER_AR("A", "B") }, { fr: "A passe car le bus est à l'arrêt", ar: "A تمر لأن الحافلة متوقفة" }],
    answer: 0,
    explanation: "En agglomération, les conducteurs doivent faciliter le départ des véhicules de transport en commun qui quittent leur arrêt.", explanationAr: "داخل المدينة يجب على السائقين تسهيل انطلاق حافلات النقل العمومي من محطاتها.",
    scene: { layout: "straight", signs: [{ icon: "/signs/information--bus-stop.svg", at: [4.4, 4.6] }], actors: [heroCar([arrive([[1.5, 14], [1.5, 8.4]]), mv([[1.5, 8.4], [1.5, -14]], 0.72, 1)]), other("#f0b24a", "B", [arrive([[3.1, 2.6], [3.1, 2.6]]), mv([[3.1, 2.6], [1.5, -2], [1.5, -14]], 0.4, 0.74, 2.6)], "bus")] },
  },
  {
    id: "p-cycliste-piste", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Cycliste sur la piste cyclable", titleAr: "دراج على مسار الدراجات",
    situation: "Vous (A) tournez à droite. Un cycliste (C) continue tout droit sur sa piste cyclable, à votre droite.", situationAr: "أنت (A) تنعطف يميناً، ودراج (C) يواصل مستقيماً على مسار الدراجات عن يمينك.",
    question: "Quel est l'ordre de passage ?", questionAr: "ما هو ترتيب المرور؟",
    choices: [{ fr: ORDER("C", "A"), ar: ORDER_AR("C", "A") }, { fr: ORDER("A", "C"), ar: ORDER_AR("A", "C") }, { fr: "A passe car il est plus rapide", ar: "A تمر لأنها أسرع" }],
    answer: 0,
    explanation: "Le cycliste qui poursuit tout droit sur sa piste conserve la priorité : contrôlez l'angle mort avant de tourner.", explanationAr: "الدراج الذي يواصل مستقيماً على مساره يحتفظ بالأسبقية: تحقق من النقطة العمياء قبل الانعطاف.",
    scene: { layout: "cross", signs: [{ icon: "/signs/information--bicycle-lane.svg", at: [-4.6, 6.6] }], actors: [heroCar([arrive([[1.5, 15], [1.5, 5.6]]), mv(S_RIGHT, 0.66, 0.95, TIGHT)]), other(C_C, "C", [arrive([[3.4, 13], [3.4, 6.2]]), mv([[3.4, 6.2], [3.4, -15]], 0.38, 0.66)], "bike")] },
  },
  {
    id: "p-marche-arriere", level: 6, pauseAt: 0.34, duration: 7600,
    title: "Manœuvre en marche arrière", titleAr: "مناورة الرجوع إلى الخلف",
    situation: "Vous (A) effectuez une marche arrière pour vous replacer, le véhicule B circule normalement.", situationAr: "أنت (A) ترجع إلى الخلف لتعديل وضعك، والمركبة B تسير بشكل عادي.",
    question: "Qui est prioritaire ?", questionAr: "لمن الأسبقية؟",
    choices: [{ fr: "B : celui qui manœuvre n'est jamais prioritaire", ar: "B: من يناور ليست له الأسبقية أبداً" }, { fr: "A : j'ai commencé la manœuvre", ar: "A: لأنني بدأت المناورة" }, { fr: "Celui qui klaxonne en premier", ar: "من ينبه أولاً" }],
    answer: 0,
    explanation: "Toute manœuvre (marche arrière, demi-tour, changement de file) se fait sans gêner : le conducteur qui manœuvre cède toujours le passage.", explanationAr: "كل مناورة (رجوع إلى الخلف، دوران، تغيير المسار) تتم دون إعاقة: من يناور يعطي الأسبقية دائماً.",
    scene: { layout: "straight", actors: [heroCar([arrive([[1.5, 4], [1.5, 6.2]], 1.4), mv([[1.5, 6.2], [1.5, -14]], 0.72, 1)]), other(C_B, "B", [arrive([[1.5, 15], [1.5, 10.5]]), mv([[1.5, 10.5], [3.2, 6], [3.2, -14]], 0.4, 0.72, 2.6)])] },
  },
  {
    id: "p-montagne", level: 6, pauseAt: 0.34, duration: 7800,
    title: "Route de montagne étroite", titleAr: "طريق جبلي ضيق",
    situation: "Sur une route de montagne étroite, vous (A) descendez et le véhicule B monte en face.", situationAr: "في طريق جبلي ضيق، أنت (A) تنزل والمركبة B تصعد في الاتجاه المقابل.",
    question: "Qui doit céder le passage ?", questionAr: "من يجب أن يعطي الأسبقية؟",
    choices: [{ fr: "A : le véhicule qui descend cède au véhicule qui monte", ar: "A: المركبة النازلة تعطي الأسبقية للصاعدة" }, { fr: "B : le véhicule qui monte doit reculer", ar: "B: المركبة الصاعدة يجب أن ترجع" }, { fr: "Le véhicule le plus léger", ar: "المركبة الأخف" }],
    answer: 0,
    explanation: "En montagne, le véhicule descendant cède le passage à celui qui monte : la remise en mouvement en côte est bien plus difficile.", explanationAr: "في الجبل، المركبة النازلة تعطي الأسبقية للصاعدة لأن الانطلاق في المرتفع أصعب بكثير.",
    scene: { layout: "straight", signs: [{ icon: "/signs/warning--steep-descent.svg", at: [4.2, 8.2] }], actors: [heroCar([arrive([[1.5, 14], [1.5, 6.6]]), mv([[1.5, 6.6], [1.5, -14]], 0.74, 1)]), other(C_B, "B", [arrive([[-1.5, -14], [-1.5, -6]]), mv([[-1.5, -6], [-1.5, 14]], 0.4, 0.72)])] },
  },
  {
    id: "p-agent", level: 6, pauseAt: 0.34, duration: 8000,
    title: "Agent qui règle la circulation", titleAr: "شرطي ينظم السير",
    situation: "Le feu est rouge pour vous (A), mais un agent de la circulation vous fait signe d'avancer.", situationAr: "الضوء أحمر بالنسبة لك (A)، لكن شرطي المرور يشير لك بالتقدم.",
    question: "Que faites-vous ?", questionAr: "ماذا تفعل؟",
    choices: [{ fr: "J'obéis à l'agent : ses ordres priment sur les feux", ar: "أطيع الشرطي: أوامره تعلو على الإشارات الضوئية" }, { fr: "Je reste arrêté, le feu rouge prime", ar: "أبقى متوقفاً لأن الضوء الأحمر يعلو" }, { fr: "J'attends que le feu passe au vert", ar: "أنتظر حتى تصير الإشارة خضراء" }],
    answer: 0,
    explanation: "La hiérarchie est claire : agent de la circulation, puis feux, puis panneaux, puis règles générales.", explanationAr: "الترتيب واضح: شرطي المرور، ثم الإشارات الضوئية، ثم العلامات، ثم القواعد العامة.",
    scene: { layout: "cross", lights: [{ at: [4.2, 4.4], state: "red" }], actors: [heroCar([arrive([[1.5, 15], [1.5, 5.6]]), mv([[1.5, 5.6], [1.5, -15]], 0.44, 0.8)]), { kind: "pedestrian", color: "#2f4f8a", label: "P", start: [-0.2, -0.2], face: 2.2, moves: [] }, other(C_B, "B", [arrive(E_IN), mv(E_GO, 0.82, 1)])] },
  },
];

scenarios.push(...priorityScenarios);
