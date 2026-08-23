"""
Toolidi Real Product Seeder — replaces fake products with real jewelry & mining items.
Uses pyodbc for proper Unicode support and Unsplash for product images.
"""
import pyodbc
import uuid
import time

SERVER = "192.168.60.3"
DATABASE = "ToolidiDb"
USERNAME = "sa"
PASSWORD = "Aa@123456"

conn = pyodbc.connect(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};"
)
conn.autocommit = True
cursor = conn.cursor()

# ─────────────────── Get IDs ───────────────────
cursor.execute("SELECT TOP 1 Id FROM Sellers WHERE IsDeleted=0")
SELLER_ID = cursor.fetchone()[0]
print(f"📦 Seller: {SELLER_ID}")

cursor.execute("SELECT Id, Name FROM Categories WHERE IsDeleted=0")
CAT_MAP = {}
for row in cursor.fetchall():
    CAT_MAP[row[1].strip()] = str(row[0])
print(f"📂 Categories: {len(CAT_MAP)}")

# ─────────────────── Delete old products ───────────────────
print("\n🗑️  حذف محصولات قدیمی...")
cursor.execute("DELETE FROM ProductImages WHERE ProductId IN (SELECT Id FROM Products)")
cursor.execute("DELETE FROM Products")
print("   ✅ حذف شد")

# ─────────────────── Image URLs (Unsplash — free) ───────────────────
IMGS = {
    "ring": [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&h=600&fit=crop",
    ],
    "necklace": [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1515562141589-67f0d569b986?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1599459183200-59c3f8012e5b?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&h=600&fit=crop",
    ],
    "bracelet": [
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&h=600&fit=crop",
    ],
    "earring": [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1630019852942-f89202989a89?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=600&fit=crop",
    ],
    "silver": [
        "https://images.unsplash.com/photo-1599459183200-59c3f8012e5b?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&h=600&fit=crop",
    ],
    "mining": [
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=600&h=600&fit=crop",
    ],
    "gem": [
        "https://images.unsplash.com/photo-1551122087-f99a4e1fbaaf?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1583937443573-08a3a6bf13a3?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
    ],
    "gold": [
        "https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1586878341523-7c8e5f6e3b8f?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&h=600&fit=crop",
    ],
}

# ─────────────────── Products ───────────────────
products = [
    # ── انگشتر ──
    {"name": "انگشتر نقره نگین فیروزه تراش آبی", "sku": "RNG-FIR-001", "cat": "انگشتر نقره‌نگین", "price": 1850000, "cmp": 2100000,
     "desc": "انگشتر نقره عیار 925 با نگین فیروزه تراش آبی اصل نیشابور. مناسب استفاده روزمره و مجلسی. وزن: 8.5 گرم.", "short": "نقره 925 با نگین فیروزه اصل نیشابور",
     "img_key": "ring", "weight": 8.5, "feat": True},
    {"name": "انگشتر طلای زرد 18 عیار نگین زمرد", "sku": "RNG-GRE-002", "cat": "طلای زرد", "price": 45000000, "cmp": 48000000,
     "desc": "انگشتر طلای 18 عیار با نگین زمرد طبیعی کلمبیایی. طراحی خاص و منحصربفرد. وزن: 6.2 گرم.", "short": "طلای 18 عیار با نگین زمرد طبیعی",
     "img_key": "gold", "weight": 6.2, "feat": True},
    {"name": "انگشتر نقره مردانه عقیق سلیمانی", "sku": "RNG-MAN-003", "cat": "انگشتر نقره‌نگین", "price": 2200000, "cmp": 2500000,
     "desc": "انگشتر نقره مردانه با نگین عقیق سلیمانی اصل یمن. مناسب هدیه و استفاده روزمره. وزن: 12 گرم.", "short": "عقیق سلیمانی اصل یمن",
     "img_key": "ring", "weight": 12, "feat": False},
    {"name": "انگشتر طلای سفید نگین الماس", "sku": "RNG-DIA-004", "cat": "طلای سفید", "price": 85000000, "cmp": 92000000,
     "desc": "انگشتر طلای سفید 18 عیار با نگین الماس 0.3 قیراط. گواهی اصالت الماس موجود است.", "short": "طلای سفید 18 عیار با الماس 0.3ct",
     "img_key": "gold", "weight": 5.8, "feat": True},
    {"name": "انگشتر نقره زنانه نگین یاقوت", "sku": "RNG-RBY-005", "cat": "انگشتر نقره‌نگین", "price": 3100000, "cmp": 3500000,
     "desc": "انگشتر نقره با نگین یاقوت کبود طبیعی. طراحی ظریف و زیبا. وزن: 7.3 گرم.", "short": "نقره با نگین یاقوت کبود طبیعی",
     "img_key": "ring", "weight": 7.3, "feat": False},
    {"name": "انگشتر نقره نگین مروارید", "sku": "RNG-PRC-006", "cat": "انگشتر نقره‌نگین", "price": 1950000, "cmp": 2300000,
     "desc": "انگشتر نقره 925 با مروارید طبیعی آب شور. جلوه‌ای باوقار و شیک.", "short": "نقره 925 با مروارید طبیعی",
     "img_key": "ring", "weight": 5.5, "feat": False},

    # ── گردنبند ──
    {"name": "گردنبند طلای زرد زنجیر فرانسوی", "sku": "NCK-FRN-001", "cat": "طلای زرد", "price": 38000000, "cmp": 42000000,
     "desc": "گردنبند طلای 18 عیار زنجیر فرانسوی با قفل ایمن. طول 45 سانتی‌متر. وزن: 15 گرم.", "short": "طلای 18 عیار زنجیر فرانسوی 45cm",
     "img_key": "necklace", "weight": 15, "feat": True},
    {"name": "گردنبند نقره با پلاک قلب", "sku": "NCK-HRT-002", "cat": "نقره‌آلات", "price": 1200000, "cmp": 1500000,
     "desc": "گردنبند نقره 925 با پلاک قلب حکاکی شده. هدیه‌ای مناسب.", "short": "نقره 925 با پلاک قلب",
     "img_key": "necklace", "weight": 4.2, "feat": False},
    {"name": "ست گردنبند و گوشواره نقره نگین اوپال", "sku": "NCK-OPA-003", "cat": "نقره‌آلات", "price": 3500000, "cmp": 4000000,
     "desc": "ست کامل گردنبند و گوشواره نقره 925 با نگین اوپال آتشین. بسته‌بندی شیک.", "short": "ست گردنبند و گوشواره اوپال",
     "img_key": "necklace", "weight": 10.5, "feat": True},
    {"name": "گردنبند طلای سفید نگین زبرجد", "sku": "NCK-PRD-004", "cat": "طلای سفید", "price": 52000000, "cmp": 56000000,
     "desc": "گردنبند طلای سفید 18 عیار با نگین زبرجد طبیعی تانزانیا.", "short": "طلای سفید با نگین زبرجد",
     "img_key": "gold", "weight": 12.3, "feat": False},

    # ── دستبند ──
    {"name": "دستبند نقره زنجیری مردانه", "sku": "BRC-MEN-001", "cat": "نقره‌آلات", "price": 1800000, "cmp": 2100000,
     "desc": "دستبند نقره 925 مردانه زنجیری با پلاک اسم. مناسب هدیه.", "short": "نقره 925 مردانه زنجیری",
     "img_key": "bracelet", "weight": 18, "feat": False},
    {"name": "دستبند طلای زرد زنجیر پاندورا", "sku": "BRC-PND-002", "cat": "طلای زرد", "price": 28000000, "cmp": 31000000,
     "desc": "دستبند طلای 18 عیار زنجیر پاندورا. قابلیت اضافه کردن آویز.", "short": "طلای 18 عیار زنجیر پاندورا",
     "img_key": "gold", "weight": 10.5, "feat": True},
    {"name": "دستبند نقره نگین فیروزه دوتکه", "sku": "BRC-FIR-003", "cat": "نقره‌آلات", "price": 2400000, "cmp": 2800000,
     "desc": "دستبند نقره 925 با دو نگین فیروزه نیشابور.", "short": "نقره 925 با دو فیروزه نیشابور",
     "img_key": "bracelet", "weight": 14, "feat": False},

    # ── گوشواره ──
    {"name": "گوشواره نقره نگین کریستال", "sku": "EAR-CHR-001", "cat": "نقره‌آلات", "price": 850000, "cmp": 1000000,
     "desc": "گوشواره نقره 925 با نگین کریستال اتریشی درخشان.", "short": "نقره 925 با کریستال اتریشی",
     "img_key": "earring", "weight": 2.8, "feat": False},
    {"name": "گوشواره طلای زرد 18 عیار میخی", "sku": "EAR-GLD-002", "cat": "طلای زرد", "price": 15000000, "cmp": 17000000,
     "desc": "گوشواره طلای 18 عیار میخی ساده و شیک.", "short": "طلای 18 عیار میخی",
     "img_key": "gold", "weight": 3.5, "feat": True},
    {"name": "گوشواره نقره آویزی نگین فیروزه", "sku": "EAR-FIR-003", "cat": "نقره‌آلات", "price": 1100000, "cmp": 1300000,
     "desc": "گوشواره نقره 925 آویزی با نگین فیروزه تراش گلابی.", "short": "نقره 925 آویزی فیروزه‌ای",
     "img_key": "earring", "weight": 3.2, "feat": False},

    # ── نقره‌آلات ──
    {"name": "سرویس چایخوری نقره 12 پارچه", "sku": "SIL-TEA-001", "cat": "نقره‌آلات", "price": 8500000, "cmp": 9800000,
     "desc": "سرویس چایخوری نقره 925 شامل قوری، قندان، شکرریز و 12 فنجان.", "short": "سرویس چای 12 پارچه نقره",
     "img_key": "silver", "weight": 1200, "feat": True},
    {"name": "جعبه جواهرات نقره حکاکی سنتی", "sku": "SIL-BOX-002", "cat": "نقره‌آلات", "price": 3200000, "cmp": 3800000,
     "desc": "جعبه جواهرات نقره 925 با حکاکی دستی طرح اسلیمی.", "short": "جعبه جواهرات نقره حکاکی دستی",
     "img_key": "silver", "weight": 350, "feat": False},

    # ── ابزار معدن ──
    {"name": "کلاه ایمنی معدن با چراغ LED", "sku": "MNT-HLM-001", "cat": "ابزار و تجهیزات معدن", "price": 450000, "cmp": 550000,
     "desc": "کلاه ایمنی معدن با چراغ LED قوی و باتری قابل شارژ. استاندارد MSHA.", "short": "کلاه ایمنی معدن LED استاندارد",
     "img_key": "mining", "weight": 450, "feat": False},
    {"name": "فیلتر ماسک معدن ضد غبار N95", "sku": "MNT-FLT-002", "cat": "ابزار و تجهیزات معدن", "price": 180000, "cmp": 220000,
     "desc": "فیلتر ماسک معدن N95 با قابلیت جذب 95% ذرات ریز غبار.", "short": "فیلتر ماسک N95 معدن",
     "img_key": "mining", "weight": 50, "feat": False},
    {"name": "چراغ قوه معدنی شارژی ضدانفجار", "sku": "MNT-LMP-003", "cat": "ابزار و تجهیزات معدن", "price": 750000, "cmp": 900000,
     "desc": "چراغ قوه معدنی LED شارژی با استاندارد ضدانفجار. روشنایی 500 لومن.", "short": "چراغ قوه معدنی ضدانفجار 500lm",
     "img_key": "mining", "weight": 280, "feat": False},

    # ── سنگ‌های قیمتی ──
    {"name": "سنگ فیروزه نیشابور تراش کابوشن", "sku": "GEM-FIR-001", "cat": "سنگ‌های قیمتی و نیمه‌قیمتی", "price": 3200000, "cmp": 3800000,
     "desc": "سنگ فیروزه نیشابور تراش کابوشن با رنگ آبی آسمانی خالص.", "short": "فیروزه نیشابور تراش کابوشن",
     "img_key": "gem", "weight": 15, "feat": True},
    {"name": "نگین عقیق سلیمانی قرمز بزرگ", "sku": "GEM-AGT-002", "cat": "سنگ‌های قیمتی و نیمه‌قیمتی", "price": 1800000, "cmp": 2200000,
     "desc": "نگین عقیق سلیمانی قرمز با نقش‌های طبیعی زیبا.", "short": "عقیق سلیمانی قرمز طبیعی",
     "img_key": "gem", "weight": 22, "feat": False},
    {"name": "تکه سنگ زمرد طبیعی کلمبیا", "sku": "GEM-EMR-003", "cat": "سنگ‌های قیمتی و نیمه‌قیمتی", "price": 15000000, "cmp": 18000000,
     "desc": "تکه سنگ زمرد طبیعی صادراتی از معدن موزو کلمبیا. گواهی GIA.", "short": "زمرد طبیعی کلمبیا با گواهی GIA",
     "img_key": "gem", "weight": 8, "feat": True},
    {"name": "نگین یاقوت کبود تراش ستاره‌ای", "sku": "GEM-SAP-004", "cat": "سنگ‌های قیمتی و نیمه‌قیمتی", "price": 8500000, "cmp": 10000000,
     "desc": "نگین یاقوت کبود تراش ستاره‌ای با رنگ آبی خیره‌کننده.", "short": "یاقوت کبود تراش ستاره‌ای",
     "img_key": "gem", "weight": 5, "feat": False},
]

# ─────────────────── Insert ───────────────────
inserted = 0
for i, p in enumerate(products):
    cat_id = CAT_MAP.get(p["cat"])
    if not cat_id:
        print(f"  ⚠️  دسته‌بندی یافت نشد: {p['cat']} — رد شد: {p['name']}")
        continue

    pid = str(uuid.uuid4()).upper()
    slug = p["sku"].lower().replace(" ", "-")
    now = "GETUTCDATE()"

    sql = f"""
INSERT INTO Products (Id, Name, Sku, CategoryId, SellerId, UnitPrice, ComparePrice, ShortDescription, FullDescription, Weight, Slug, IsFeatured, IsNewArrival, IsBestSeller, PublishStatus, IsActive, IsDeleted, IsPhysical, IsTaxable, ViewCount, RatingAverage, RatingCount, CreatedAt, UpdatedAt, PublishedAt)
VALUES ('{pid}', N'{p["name"]}', '{p["sku"]}', '{cat_id}', '{SELLER_ID}', {p["price"]}, {p["cmp"]}, N'{p["short"]}', N'{p["desc"]}', {p["weight"]}, '{slug}', {1 if p.get("feat") else 0}, {1 if i < 5 else 0}, {1 if i % 7 == 0 else 0}, 'Published', 1, 0, 1, 1, {100 + i * 15}, {4.0 + (i % 5) * 0.2:.1f}, {5 + i * 3}, {now}, {now}, DATEADD(DAY, -{10 + i}, {now}))
"""
    cursor.execute(sql)

    # Insert images (1 primary + 2-3 additional)
    imgs = IMGS.get(p["img_key"], IMGS["ring"])
    for j, img_url in enumerate(imgs[:3]):
        img_id = str(uuid.uuid4()).upper()
        img_sql = f"""
INSERT INTO ProductImages (Id, ProductId, ImageUrl, AltText, DisplayOrder, IsPrimary, IsActive, IsDeleted, CreatedAt, UpdatedAt, ProductId1)
VALUES ('{img_id}', '{pid}', '{img_url}', N'{p["name"]}', {j + 1}, {1 if j == 0 else 0}, 1, 0, {now}, {now}, '{pid}')
"""
        cursor.execute(img_sql)

    inserted += 1
    print(f"  ✅ [{inserted:02d}] {p['name']} ({p['sku']})")

print(f"\n{'='*50}")
print(f"✅ {inserted} محصول با موفقیت اضافه شد")
print(f"📷 هر محصول ۱-۳ تصویر واقعی دارد")
print(f"🏷️ قیمت‌ها واقعی و به تومان هستند")
