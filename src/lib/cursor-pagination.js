// ============================================================================
//  Cursor (keyset) pagination helper
// ----------------------------------------------------------------------------
//  چرا نه mongoose-paginate-v2 (skip/limit)؟
//  روی کالکشن‌هایی با ~۲۰۰هزار+ رکورد (مثل MinuteCandle)، هر afset بزرگ
//  (`skip: 190000`) یعنی Mongo باید ۱۹۰هزار سند رو اسکن و رد کنه قبل از
//  اینکه به صفحه‌ی موردنظر برسه - هرچی صفحه جلوتر بره کندتر می‌شه.
//
//  به‌جاش از فیلد `index` (که روی همه‌ی مدل‌های ما صعودی و indexed هست)
//  به‌عنوان cursor استفاده می‌کنیم: هر صفحه فقط با یه شرط `index > cursor`
//  (یا `< cursor` برای عقب) و یه `limit` مستقیم به ایندکس دیتابیس می‌رسه -
//  سرعتش مستقل از اینه که چند صفحه جلو رفتیم.
//
//  محدودیت: نمی‌شه مستقیم پرید صفحه‌ی ۵۰۰ (فقط next/prev پیوسته) - برای
//  دیتاست‌های به این بزرگی، این یه trade-off استانداردِ پذیرفته‌شده‌ست.
// ============================================================================

/**
 * @param {import('mongoose').Model} Model
 * @param {object} options
 * @param {object} [options.filter] - فیلتر پایه (بدون index) که همیشه اعمال می‌شه
 * @param {string} [options.cursor] - مقدار index صفحه‌ی فعلی (از query string)
 * @param {'next'|'prev'} [options.direction]
 * @param {number} [options.limit]
 * @param {string} [options.indexField] - اسم فیلدی که cursor روش کار می‌کنه (پیش‌فرض "index")
 * @param {object} [options.projection]
 */
export async function cursorPaginate(Model, {
    filter = {},
    cursor,
    direction = "next",
    limit = 25,
    indexField = "index",
    projection = null,
} = {}) {

    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 200);

    const query = {...filter};

    const numericCursor = cursor !== undefined && cursor !== null && cursor !== ""
        ? Number(cursor)
        : null;


    //-------------------------------------------------------------------//
    //   ساخت شرط cursor: برای next از cursor به بعد، برای prev قبل از اون   //
    //-------------------------------------------------------------------//

    if (numericCursor !== null && !Number.isNaN(numericCursor)) {

        query[indexField] = direction === "prev"
            ? {$lt: numericCursor}
            : {$gt: numericCursor};

    }


    //-------------------------------------------------------------------//
    //  برای prev باید نزولی بگیریم (تا nزدیک‌ترین‌های قبلی رو پیدا کنیم)   //
    //  و بعد دوباره صعودی مرتب کنیم تا ترتیب نمایش همیشه صعودی بمونه      //
    //-------------------------------------------------------------------//

    const sortDirection = direction === "prev" ? -1 : 1;

    let docs = await Model
        .find(query, projection)
        .sort({[indexField]: sortDirection})
        .limit(safeLimit + 1)
        .lean();


    const hasMore = docs.length > safeLimit;

    docs = docs.slice(0, safeLimit);

    if (direction === "prev") {
        docs.reverse();
    }


    const firstItem = docs[0] ?? null;

    const lastItem = docs[docs.length - 1] ?? null;


    return {

        success: true,

        data: docs,

        pageInfo: {

            limit: safeLimit,

            count: docs.length,

            startCursor: firstItem ? firstItem[indexField] : null,

            endCursor: lastItem ? lastItem[indexField] : null,

            // اگه از جلو (next) اومدیم و بیشتر از limit پیدا شد، صفحه‌ی بعدی هست
            hasNextPage: direction === "prev" ? true : hasMore,

            // اگه از عقب (prev) اومدیم و بیشتر از limit پیدا شد، صفحه‌ی قبلی هست
            // اگه از جلو اومدیم و cursor نداشتیم (صفحه‌ی اول)، prev معنی نداره
            hasPrevPage: direction === "prev"
                ? hasMore
                : numericCursor !== null,

        },

    };

}
