// import {NextConfig} from 'next';
// import createNextIntlPlugin from 'next-intl/plugin';
 
// const nextConfig: NextConfig = {};
 
// const withNextIntl = createNextIntlPlugin();

// export default withNextIntl(nextConfig);
// import createNextIntlPlugin from 'next-intl/plugin';

// const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default withNextIntl(nextConfig);

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {};

module.exports = withNextIntl(nextConfig);