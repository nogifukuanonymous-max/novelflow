import type {
  Work, Episode, Chapter, MediaPack, User,
  Notification, Bookmark, Comment, ReadProgress,
} from "@/types";

/* ══════════════════════════════════════
   モックユーザー
══════════════════════════════════════ */
export const MOCK_ME: User = {
  id: "user-001",
  displayName: "深夜の蛍",
  username: "shinya_hotaru",
  avatarUrl: null,
  bio: "恋愛小説を書いています。夜と雨と静かな別れが好きです。",
  role: "author",
  followerCount: 1204,
  followingCount: 88,
  totalLikeCount: 12400,
  workCount: 4,
};

/* ══════════════════════════════════════
   モック作品
══════════════════════════════════════ */
export const MOCK_WORKS: Work[] = [
  {
    id: "work-001",
    title: "花と雨の形而上学",
    synopsis: "春の終わりに出会ったふたりは、互いの名前すら知らないまま別れた。三年後、偶然の再会が運命を動かす——。\n\n名前を呼ぶことの意味と、記憶の中に生き続ける「あなた」を描く、静かな恋愛小説。",
    genre: "romance",
    ageRating: "all",
    serialStatus: "completed",
    readingMode: "both",
    thumbnailUrl: null,
    totalCharCount: 128000,
    episodeCount: 13,
    likeCount: 4231,
    readCompleteCount: 892,
    isPublished: true,
    publishedAt: "2024-03-01T00:00:00Z",
    author: { id: "user-001", displayName: "深夜の蛍", username: "shinya_hotaru", avatarUrl: null },
    nameChars: [
      { id: "char-001", displayName: "主人公", reading: "しゅじんこう", gender: "neutral", sortOrder: 0 },
      { id: "char-002", displayName: "優一",   reading: "ゆういち",    gender: "male",    sortOrder: 1 },
    ],
    tags: [
      { id: "tag-001", name: "恋愛" },
      { id: "tag-002", name: "純愛" },
      { id: "tag-003", name: "再会" },
    ],
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-04-01T00:00:00Z",
  },
  {
    id: "work-002",
    title: "海底の図書館",
    synopsis: "深海に沈んだ図書館で、司書は永遠に本を読み続けている。ある日、潜水艇で訪れた少女が禁断の棚を開けてしまう。",
    genre: "sf",
    ageRating: "all",
    serialStatus: "ongoing",
    readingMode: "flip_only",
    thumbnailUrl: null,
    totalCharCount: 64000,
    episodeCount: 8,
    likeCount: 2841,
    readCompleteCount: 312,
    isPublished: true,
    publishedAt: "2024-01-15T00:00:00Z",
    author: { id: "user-002", displayName: "塩と珊瑚", username: "shio_sango", avatarUrl: null },
    nameChars: [],
    tags: [{ id: "tag-004", name: "SF" }, { id: "tag-005", name: "図書館" }],
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-04-10T00:00:00Z",
  },
  {
    id: "work-003",
    title: "猫と怪異の方程式",
    synopsis: "猫が見えているものは人間には見えない。そして猫だけが解ける謎がある。",
    genre: "horror",
    ageRating: "all",
    serialStatus: "ongoing",
    readingMode: "both",
    thumbnailUrl: null,
    totalCharCount: 38000,
    episodeCount: 6,
    likeCount: 1923,
    readCompleteCount: 201,
    isPublished: true,
    publishedAt: "2024-02-01T00:00:00Z",
    author: { id: "user-003", displayName: "雨硝子", username: "ame_glass", avatarUrl: null },
    nameChars: [],
    tags: [{ id: "tag-006", name: "ホラー" }, { id: "tag-007", name: "怪異" }],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-04-08T00:00:00Z",
  },
  {
    id: "work-004",
    title: "青と銀の境界線",
    synopsis: "魔法が消えかけた世界で、最後の魔法使いは空を染める色を守るために戦う。",
    genre: "fantasy",
    ageRating: "all",
    serialStatus: "completed",
    readingMode: "both",
    thumbnailUrl: null,
    totalCharCount: 95000,
    episodeCount: 11,
    likeCount: 3102,
    readCompleteCount: 654,
    isPublished: true,
    publishedAt: "2023-10-01T00:00:00Z",
    author: { id: "user-004", displayName: "碧の夜想", username: "midori_sou", avatarUrl: null },
    nameChars: [
      { id: "char-003", displayName: "主人公", reading: "しゅじんこう", gender: "neutral", sortOrder: 0 },
    ],
    tags: [{ id: "tag-008", name: "ファンタジー" }, { id: "tag-009", name: "魔法" }],
    createdAt: "2023-10-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
];

/* ══════════════════════════════════════
   モックチャプター・エピソード
══════════════════════════════════════ */
export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: "ch-001",
    title: "第一章　出会いと別れ",
    sortOrder: 0,
    episodes: [
      {
        id: "ep-001", workId: "work-001", chapterId: "ch-001",
        title: "春の終わりに",
        bodyJson: {},
        charCount: 3200, sortOrder: 0,
        isPublished: true, publishAt: null,
        hasImage: false, hasVideo: false,
        likeCount: 312, mediaSlots: [],
        publishedAt: "2024-03-01T00:00:00Z",
        createdAt: "2024-03-01T00:00:00Z", updatedAt: "2024-03-01T00:00:00Z",
      },
      {
        id: "ep-002", workId: "work-001", chapterId: "ch-001",
        title: "名前のない約束",
        bodyJson: {},
        charCount: 4100, sortOrder: 1,
        isPublished: true, publishAt: null,
        hasImage: true, hasVideo: false,
        likeCount: 428, mediaSlots: [
          { id: "slot-001", slotKey: "slot_001", defaultMediaUrl: null, defaultMediaType: "image", altText: "夕暮れの公園", sortOrder: 0 },
        ],
        publishedAt: "2024-03-08T00:00:00Z",
        createdAt: "2024-03-08T00:00:00Z", updatedAt: "2024-03-08T00:00:00Z",
      },
    ],
  },
  {
    id: "ch-002",
    title: "第二章　三年後の風景",
    sortOrder: 1,
    episodes: [
      {
        id: "ep-003", workId: "work-001", chapterId: "ch-002",
        title: "交差する夜明け",
        bodyJson: {},
        charCount: 5800, sortOrder: 2,
        isPublished: true, publishAt: null,
        hasImage: true, hasVideo: false,
        likeCount: 612, mediaSlots: [
          { id: "slot-002", slotKey: "slot_001", defaultMediaUrl: null, defaultMediaType: "image", altText: "夜明けの空港ロビー", sortOrder: 0 },
          { id: "slot-003", slotKey: "slot_002", defaultMediaUrl: null, defaultMediaType: "image", altText: "搭乗ゲート", sortOrder: 1 },
        ],
        publishedAt: "2024-03-15T00:00:00Z",
        createdAt: "2024-03-15T00:00:00Z", updatedAt: "2024-03-15T00:00:00Z",
      },
      {
        id: "ep-004", workId: "work-001", chapterId: "ch-002",
        title: "雨の中の再会",
        bodyJson: {},
        charCount: 4600, sortOrder: 3,
        isPublished: true, publishAt: null,
        hasImage: false, hasVideo: false,
        likeCount: 389, mediaSlots: [],
        publishedAt: "2024-03-22T00:00:00Z",
        createdAt: "2024-03-22T00:00:00Z", updatedAt: "2024-03-22T00:00:00Z",
      },
      {
        id: "ep-005", workId: "work-001", chapterId: "ch-002",
        title: "消えない記憶の形",
        bodyJson: {},
        charCount: 5100, sortOrder: 4,
        isPublished: true, publishAt: null,
        hasImage: false, hasVideo: true,
        likeCount: 501, mediaSlots: [
          { id: "slot-004", slotKey: "slot_001", defaultMediaUrl: null, defaultMediaType: "video", altText: "雨の駅前", sortOrder: 0 },
        ],
        publishedAt: "2024-03-29T00:00:00Z",
        createdAt: "2024-03-29T00:00:00Z", updatedAt: "2024-03-29T00:00:00Z",
      },
    ],
  },
];

/* ══════════════════════════════════════
   モックメディアパック
══════════════════════════════════════ */
export const MOCK_PACKS: MediaPack[] = [
  {
    id: "pack-001",
    workId: "work-001",
    authorId: "user-001",
    packName: "有村架純パック",
    description: "主人公のイメージを有村架純さんで表現したパックです。",
    thumbnailUrl: null,
    fileUrl: null,
    version: "1.0.0",
    isPublished: true,
    downloadCount: 1204,
    signatureHash: "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5",
    mediaMaps: [],
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    id: "pack-002",
    workId: "work-001",
    authorId: "user-001",
    packName: "橋本環奈パック",
    description: "主人公のイメージを橋本環奈さんで表現したパックです。",
    thumbnailUrl: null,
    fileUrl: null,
    version: "1.0.0",
    isPublished: true,
    downloadCount: 892,
    signatureHash: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    mediaMaps: [],
    createdAt: "2024-04-05T00:00:00Z",
  },
];

/* ══════════════════════════════════════
   モック通知
══════════════════════════════════════ */
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-001", type: "like",
    actorId: "user-010", actorName: "tsuki_yoru",
    workId: "work-001", workTitle: "花と雨の形而上学",
    episodeId: null, episodeTitle: null,
    packId: null, packName: null, message: null,
    isRead: false, createdAt: "2024-04-15T09:00:00Z",
  },
  {
    id: "notif-002", type: "follow",
    actorId: "user-011", actorName: "haru_221",
    workId: null, workTitle: null,
    episodeId: null, episodeTitle: null,
    packId: null, packName: null, message: null,
    isRead: false, createdAt: "2024-04-15T08:00:00Z",
  },
  {
    id: "notif-003", type: "comment",
    actorId: null, actorName: null,
    workId: "work-001", workTitle: "花と雨の形而上学",
    episodeId: "ep-005", episodeTitle: "消えない記憶の形",
    packId: null, packName: null, message: null,
    isRead: false, createdAt: "2024-04-15T06:00:00Z",
  },
  {
    id: "notif-004", type: "new_pack",
    actorId: "user-002", actorName: "塩と珊瑚",
    workId: "work-002", workTitle: "海底の図書館",
    episodeId: null, episodeTitle: null,
    packId: "pack-003", packName: "橋本環奈パック",
    message: null,
    isRead: true, createdAt: "2024-04-13T12:00:00Z",
  },
];

/* ══════════════════════════════════════
   モックブックマーク
══════════════════════════════════════ */
export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: "bm-001", workId: "work-001", folderName: null,
    createdAt: "2024-04-01T00:00:00Z",
    work: {
      id: "work-001", title: "花と雨の形而上学",
      thumbnailUrl: null, serialStatus: "completed", genre: "romance",
      author: { id: "user-001", displayName: "深夜の蛍", username: "shinya_hotaru", avatarUrl: null },
    },
  },
  {
    id: "bm-002", workId: "work-002", folderName: null,
    createdAt: "2024-03-15T00:00:00Z",
    work: {
      id: "work-002", title: "海底の図書館",
      thumbnailUrl: null, serialStatus: "ongoing", genre: "sf",
      author: { id: "user-002", displayName: "塩と珊瑚", username: "shio_sango", avatarUrl: null },
    },
  },
];

/* ══════════════════════════════════════
   モック読書進捗
══════════════════════════════════════ */
export const MOCK_PROGRESSES: ReadProgress[] = [
  {
    workId: "work-001",
    lastEpisodeId: "ep-003",
    lastScrollPct: 65,
    lastFlipPage: 3,
    completedAt: null,
    updatedAt: "2024-04-15T09:30:00Z",
  },
];

/* ══════════════════════════════════════
   モックコメント
══════════════════════════════════════ */
export const MOCK_COMMENTS: Comment[] = [
  {
    id: "cmt-001",
    episodeId: "ep-003",
    user: { id: "user-010", displayName: "tsuki_yoru", username: "tsuki_yoru", avatarUrl: null },
    parentId: null,
    body: "名前変換でさくらにしたら感情移入が半端なかったです。第3話の夜明けのシーン、涙が止まらなかった…",
    likeCount: 24,
    createdAt: "2024-04-13T10:00:00Z",
  },
  {
    id: "cmt-002",
    episodeId: "ep-003",
    user: { id: "user-011", displayName: "haru_221", username: "haru_221", avatarUrl: null },
    parentId: null,
    body: "ページめくりモードで読んだら一気に世界観に入れました。文体がとにかく美しい。",
    likeCount: 18,
    createdAt: "2024-04-12T15:00:00Z",
  },
  {
    id: "cmt-003",
    episodeId: "ep-003",
    user: { id: "user-012", displayName: "kiri_writer", username: "kiri_writer", avatarUrl: null },
    parentId: null,
    body: "「有村架純パック」を当てて読んだらまた違う印象になって面白かった。パック機能最高。",
    likeCount: 31,
    createdAt: "2024-04-10T08:00:00Z",
  },
];
