// 座ってできる運動メニュー
export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  category: 'stretch' | 'strength' | 'cardio' | 'relaxation';
  difficulty: 1 | 2 | 3; // 1=簡単, 2=普通, 3=少しきつい
  calories_burned: number; // おおよその消費カロリー
  steps: string[];
  benefits: string[];
  caution?: string;
}

export const EXERCISES: Exercise[] = [
  // ストレッチ
  {
    id: 'e1',
    name: '首のストレッチ',
    description: 'デスクワークで凝った首をほぐす',
    duration_min: 3,
    category: 'stretch',
    difficulty: 1,
    calories_burned: 5,
    steps: [
      '背筋を伸ばして椅子に座る',
      '頭をゆっくり右に傾け、10秒キープ',
      '左も同様に10秒キープ',
      '頭を前に倒し、10秒キープ',
      '3セット繰り返す',
    ],
    benefits: ['肩こり解消', '頭痛予防', 'リラックス効果'],
  },
  {
    id: 'e2',
    name: '肩回し',
    description: '肩甲骨をほぐして血流改善',
    duration_min: 2,
    category: 'stretch',
    difficulty: 1,
    calories_burned: 5,
    steps: [
      '両肩を耳に近づけるように上げる',
      '後ろに大きく回す（10回）',
      '前に大きく回す（10回）',
      '肩を上げたまま5秒キープして、ストンと落とす',
    ],
    benefits: ['肩こり解消', '血行促進', '姿勢改善'],
  },
  {
    id: 'e3',
    name: '背中のストレッチ',
    description: '猫背を解消し、背中の緊張をほぐす',
    duration_min: 3,
    category: 'stretch',
    difficulty: 1,
    calories_burned: 5,
    steps: [
      '椅子に座り、両手を前で組む',
      '背中を丸めながら腕を前に伸ばす（猫のポーズ）',
      '10秒キープ',
      '今度は胸を張り、肩甲骨を寄せる',
      '10秒キープ、これを5回繰り返す',
    ],
    benefits: ['背中の疲れ解消', '姿勢改善', '呼吸が楽になる'],
  },
  {
    id: 'e4',
    name: '足首回し',
    description: 'むくみ解消に効果的',
    duration_min: 2,
    category: 'stretch',
    difficulty: 1,
    calories_burned: 3,
    steps: [
      '片足を床から浮かせる',
      '足首を右に10回、左に10回回す',
      '反対の足も同様に行う',
      'つま先を上げ下げする（各10回）',
    ],
    benefits: ['むくみ解消', '血行促進', '冷え性改善'],
  },

  // 筋トレ（座ったまま）
  {
    id: 'e5',
    name: '座ったままスクワット',
    description: '太ももを鍛えて基礎代謝アップ',
    duration_min: 5,
    category: 'strength',
    difficulty: 2,
    calories_burned: 20,
    steps: [
      '椅子の前半分に座る',
      '足を肩幅に開く',
      '腕を前に伸ばしながら、ゆっくり立ち上がる',
      'ゆっくり座る（お尻が椅子に着く直前で止める）',
      '10回 × 3セット',
    ],
    benefits: ['下半身強化', '基礎代謝アップ', '膝の負担が少ない'],
    caution: '膝に痛みがある場合は中止してください',
  },
  {
    id: 'e6',
    name: 'かかと上げ',
    description: 'ふくらはぎを鍛えて血流改善',
    duration_min: 3,
    category: 'strength',
    difficulty: 1,
    calories_burned: 10,
    steps: [
      '椅子に座り、足を床につける',
      'かかとを高く上げる（つま先立ち）',
      '3秒キープしてゆっくり下ろす',
      '20回 × 2セット',
    ],
    benefits: ['むくみ解消', 'ふくらはぎ強化', '血行促進'],
  },
  {
    id: 'e7',
    name: '座ったまま腹筋',
    description: 'お腹を引き締める',
    duration_min: 5,
    category: 'strength',
    difficulty: 2,
    calories_burned: 15,
    steps: [
      '椅子の前半分に座る',
      '背もたれに寄りかからず、背筋を伸ばす',
      '両膝を揃えて、床から10cm浮かせる',
      '5秒キープして下ろす',
      '10回 × 3セット',
    ],
    benefits: ['腹筋強化', '姿勢改善', '腰痛予防'],
    caution: '腰に痛みがある場合は無理しないでください',
  },
  {
    id: 'e8',
    name: '手のグーパー運動',
    description: '握力強化と血流改善',
    duration_min: 2,
    category: 'strength',
    difficulty: 1,
    calories_burned: 5,
    steps: [
      '両手を前に伸ばす',
      '力強くグーを握る（3秒）',
      '指を大きく開いてパー（3秒）',
      '30回繰り返す',
    ],
    benefits: ['握力強化', '血行促進', '脳の活性化'],
  },

  // 有酸素運動（座ったまま）
  {
    id: 'e9',
    name: '座ったまま足踏み',
    description: '心肺機能を高める簡単有酸素運動',
    duration_min: 5,
    category: 'cardio',
    difficulty: 2,
    calories_burned: 25,
    steps: [
      '椅子に浅く座る',
      '背筋を伸ばす',
      '太ももを交互に上げ下げ（足踏み）',
      'テンポよく1分間続ける',
      '30秒休憩して、計3セット',
    ],
    benefits: ['心肺機能向上', 'カロリー消費', '足の筋力維持'],
    caution: '動悸がしたら休憩してください',
  },
  {
    id: 'e10',
    name: '腕振り運動',
    description: '上半身の有酸素運動',
    duration_min: 3,
    category: 'cardio',
    difficulty: 1,
    calories_burned: 15,
    steps: [
      '椅子に座り、肘を90度に曲げる',
      '腕を前後に大きく振る',
      'テンポよく30秒続ける',
      '15秒休憩して、計3セット',
    ],
    benefits: ['肩こり解消', '代謝アップ', '二の腕引き締め'],
  },

  // リラクゼーション
  {
    id: 'e11',
    name: '深呼吸エクササイズ',
    description: 'ストレス解消と血圧低下に',
    duration_min: 5,
    category: 'relaxation',
    difficulty: 1,
    calories_burned: 3,
    steps: [
      '椅子に座り、目を閉じる',
      '4秒かけて鼻から息を吸う',
      '4秒間息を止める',
      '8秒かけて口からゆっくり吐く',
      '5回繰り返す',
    ],
    benefits: ['ストレス軽減', '血圧低下', '自律神経を整える'],
  },
  {
    id: 'e12',
    name: '瞑想ミニセッション',
    description: '心を落ち着かせる5分間の瞑想',
    duration_min: 5,
    category: 'relaxation',
    difficulty: 1,
    calories_burned: 3,
    steps: [
      '椅子に座り、背筋を伸ばす',
      '目を閉じて呼吸に意識を向ける',
      '雑念が浮かんでも、呼吸に意識を戻す',
      '5分間続ける',
    ],
    benefits: ['ストレス軽減', '集中力向上', '心の安定'],
  },
];

export const EXERCISE_CATEGORY_LABELS: Record<string, string> = {
  stretch: 'ストレッチ',
  strength: '筋トレ',
  cardio: '有酸素運動',
  relaxation: 'リラクゼーション',
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '簡単',
  2: '普通',
  3: '少しきつい',
};
