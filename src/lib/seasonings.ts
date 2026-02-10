// 調味料の塩分データベース（大さじ1あたりの塩分g）
export const SEASONINGS = [
  // 基本調味料
  { id: 's1', name: '醤油', salt_per_tbsp: 2.6, salt_per_tsp: 0.9, category: '基本' },
  { id: 's2', name: '減塩醤油', salt_per_tbsp: 1.3, salt_per_tsp: 0.4, category: '基本' },
  { id: 's3', name: '味噌', salt_per_tbsp: 2.2, salt_per_tsp: 0.7, category: '基本' },
  { id: 's4', name: '減塩味噌', salt_per_tbsp: 1.1, salt_per_tsp: 0.4, category: '基本' },
  { id: 's5', name: '塩', salt_per_tbsp: 18, salt_per_tsp: 6, category: '基本' },
  { id: 's6', name: 'めんつゆ（3倍濃縮）', salt_per_tbsp: 1.8, salt_per_tsp: 0.6, category: '基本' },
  { id: 's7', name: 'めんつゆ（ストレート）', salt_per_tbsp: 0.5, salt_per_tsp: 0.17, category: '基本' },
  { id: 's8', name: 'ポン酢', salt_per_tbsp: 1.5, salt_per_tsp: 0.5, category: '基本' },

  // ソース類
  { id: 's9', name: 'ウスターソース', salt_per_tbsp: 1.5, salt_per_tsp: 0.5, category: 'ソース' },
  { id: 's10', name: '中濃ソース', salt_per_tbsp: 1.0, salt_per_tsp: 0.3, category: 'ソース' },
  { id: 's11', name: 'ケチャップ', salt_per_tbsp: 0.5, salt_per_tsp: 0.17, category: 'ソース' },
  { id: 's12', name: 'マヨネーズ', salt_per_tbsp: 0.3, salt_per_tsp: 0.1, category: 'ソース' },
  { id: 's13', name: 'オイスターソース', salt_per_tbsp: 2.1, salt_per_tsp: 0.7, category: 'ソース' },

  // 和風だし
  { id: 's14', name: '顆粒だし', salt_per_tbsp: 3.9, salt_per_tsp: 1.3, category: 'だし' },
  { id: 's15', name: '減塩顆粒だし', salt_per_tbsp: 1.5, salt_per_tsp: 0.5, category: 'だし' },
  { id: 's16', name: '鶏ガラスープの素', salt_per_tbsp: 4.5, salt_per_tsp: 1.5, category: 'だし' },
  { id: 's17', name: 'コンソメ（顆粒）', salt_per_tbsp: 4.3, salt_per_tsp: 1.4, category: 'だし' },

  // その他
  { id: 's18', name: '味の素', salt_per_tbsp: 0, salt_per_tsp: 0, category: 'その他' },
  { id: 's19', name: '酢', salt_per_tbsp: 0, salt_per_tsp: 0, category: 'その他' },
  { id: 's20', name: 'みりん', salt_per_tbsp: 0, salt_per_tsp: 0, category: 'その他' },
  { id: 's21', name: '料理酒', salt_per_tbsp: 0.4, salt_per_tsp: 0.13, category: 'その他' },
  { id: 's22', name: '塩麹', salt_per_tbsp: 2.0, salt_per_tsp: 0.7, category: 'その他' },
  { id: 's23', name: '白だし', salt_per_tbsp: 2.4, salt_per_tsp: 0.8, category: 'だし' },
  { id: 's24', name: '焼肉のタレ', salt_per_tbsp: 1.2, salt_per_tsp: 0.4, category: 'ソース' },
];

export interface SeasoningEntry {
  seasoning_id: string;
  name: string;
  amount: number; // 量
  unit: 'tbsp' | 'tsp'; // 大さじ or 小さじ
  salt_g: number; // 計算された塩分
}

// 塩分を計算
export function calculateSalt(seasoningId: string, amount: number, unit: 'tbsp' | 'tsp'): number {
  const seasoning = SEASONINGS.find(s => s.id === seasoningId);
  if (!seasoning) return 0;

  const saltPerUnit = unit === 'tbsp' ? seasoning.salt_per_tbsp : seasoning.salt_per_tsp;
  return Math.round(saltPerUnit * amount * 10) / 10;
}

// カテゴリでグループ化
export function getSeasoningsByCategory(): Record<string, typeof SEASONINGS> {
  return SEASONINGS.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof SEASONINGS>);
}
