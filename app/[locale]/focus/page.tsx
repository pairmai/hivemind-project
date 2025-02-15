"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function FocusPage() {
    const router = useRouter();
    const t = useTranslations("focus");
    const [selected, setSelected] = useState<string[]>([]);

    const handleSelect = (category: string) => {
        setSelected((prev) =>
            prev.includes(category)
                ? prev.filter((item) => item !== category)
                : [...prev, category]
        );
    };

    return (
        <div className="flex flex-col mt-8 min-h-screen text-center">
            <h1 className="text-3xl font-bold mb-2">{t("mainFocusTitle")}</h1>
            <p className="mb-4">{t("mainFocusSubtitle")}</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 justify-center items-center max-w-screen-lg mx-auto">
                {["designAndCreativity", "MarketingAndSocialMedia", "education", "it", "business", "personalGrowth", "finance"].map((category) => (
                    <div
                        key={category}
                        className={`w-full h-[160px] flex flex-col items-center justify-center border p-4 rounded-lg transition-all focus:outline-none focus:ring-3 ${selected.includes(category) ? "border-blue ring-blue" : "border-gray-300"}`}
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(category)}
                            onChange={() => handleSelect(category)}
                            id={category}
                            className="hidden"
                        />
                        <label
                            htmlFor={category}
                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer focus:ring-3 focus:ring-blue"
                        >
                            <img src={`/${category}.png`} alt={`${category}Logo`} width={72} height={72} className="mx-auto mb-2" />
                            <span className="text-sm text-center text-dark-400 font-bold mt-2">{t(category)}</span>
                        </label>
                    </div>
                ))}
            </div>
            <button
                onClick={() => router.push("/dashboard")}
                disabled={selected.length === 0}
                className={`mt-8 w-48 py-3 px-6 rounded-lg transition-all mx-auto 
        ${selected.length === 0
                        ? "bg-gray-400 text-gray-300 cursor-not-allowed"
                        : "bg-dark-600 text-white hover:bg-dark-700"}`}
            >
                {t("letsBegin")}
            </button>

            <p className="mt-4 text-center text-dark-600">
                {t("explore")}
                <a href="/dashboard" className="text-dark-600 underline ml-2">{t("skip")}</a>
            </p>

        </div>
    );
}
