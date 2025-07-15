module.exports = {
    extends: ['next/core-web-vitals', 'plugin:import/recommended'],
    plugins: ['simple-import-sort'],
    rules: {
        'simple-import-sort/imports': ['error', {
            groups: [
                ['^react', '^next'],
                ['^@?\\w'],
                ['^@/'],
                ['^\\u0000'],
                ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
                ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
                ['^.+\\.s?css$']
            ]
        }],
        'simple-import-sort/exports': 'error',
    },
}