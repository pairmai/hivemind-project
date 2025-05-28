import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],


	darkMode: "class",
	theme: {
		extend: {
			colors: {
				dark: {
					'100': '#D9D9D9',
					'200': '#B3B3B3',
					'300': '#8C8A8A',
					'400': '#616161',
					'500': '#1F2937',
					'600': '#FBFBFB',
					'700': '#6C6C70',
					'800': '#5D5D5D',
					'900': '#F4F4F4'
				},
				blue: '#2C87F2',
				red: '#FF3333',
				green: '#13AE85',
			},
		},
		fontSize: {
			xs: '.75rem',
			sm: '.850rem',
			base: '1rem',
			lg: '1.125rem',
			xl: '1.25rem',
			'2xl': '1.5rem',
			'3xl': '1.850rem'
		}
	},
	plugins: [
		require('daisyui'),
		require("tailwindcss-animate")
	],
} satisfies Config;