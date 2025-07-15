module.exports = {
    singleQuote: true,
    trailingComma: 'all',
    importOrder: [
        '^react(.*)$',
        '<THIRD_PARTY_MODULES>',
        '^@/components/(.*)$',
        '^@/lib/(.*)$',
        '^[./]',
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    plugins: [require('prettier-plugin-sort-imports')],
};