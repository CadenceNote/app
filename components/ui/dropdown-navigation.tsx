import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";

type Props = {
    navItems: {
        id: number;
        label: string;
        subMenus?: {
            title: string;
            items: {
                label: string;
                description: string;
                icon: React.ElementType;
                href?: string;
            }[];
        }[];
        link?: string;
    }[];
};

export function DropdownNavigation({ navItems }: Props) {
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);

    const handleHover = (menuLabel: string | null) => {
        setOpenMenu(menuLabel);
    };

    const [isHover, setIsHover] = useState<number | null>(null);
    return (
        <div className="relative">
            <ul className="relative flex items-center space-x-0">
                {navItems.map((navItem) => (
                    <li
                        key={navItem.label}
                        className="relative"
                        onMouseEnter={() => handleHover(navItem.label)}
                        onMouseLeave={() => handleHover(null)}
                    >
                        <button
                            className="text-xl font-semibold py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 relative"
                            onMouseEnter={() => setIsHover(navItem.id)}
                            onMouseLeave={() => setIsHover(null)}
                        >
                            {navItem.subMenus && (
                                <Menu
                                    className={`h-4 w-4 mr-2 mt-1 ${isHover === navItem.id || openMenu === navItem.label ? 'rotate-90 duration-300 transition-transform' : 'duration-300'}`}
                                />
                            )}
                            <span>{navItem.label}</span>

                            {(isHover === navItem.id || openMenu === navItem.label) && (
                                <motion.div
                                    layoutId="hover-bg"
                                    className="absolute inset-0 size-full bg-primary/10"
                                    style={{ borderRadius: 99 }}
                                />
                            )}
                        </button>

                        <AnimatePresence>
                            {openMenu === navItem.label && navItem.subMenus && (
                                <div className="w-auto absolute left-0 top-full pt-2">
                                    <motion.div
                                        className="bg-background border border-border p-4 w-max"
                                        style={{ borderRadius: 16 }}
                                        layoutId="menu"
                                    >
                                        <div className="w-fit shrink-0 flex space-x-9 overflow-hidden">
                                            {navItem.subMenus.map((sub) => (
                                                <motion.div layout className="w-full" key={sub.title}>
                                                    <h3 className="mb-4 text-sm font-medium capitalize text-muted-foreground">
                                                        {sub.title}
                                                    </h3>
                                                    <ul className="space-y-6">
                                                        {sub.items.map((item) => {
                                                            const Icon = item.icon;
                                                            return (
                                                                <li key={item.label}>
                                                                    <Link
                                                                        href={item.href || "#"}
                                                                        className="flex items-start space-x-3 group"
                                                                    >
                                                                        <div className="border border-border text-foreground rounded-md flex items-center justify-center size-9 shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                                                                            <Icon className="h-5 w-5 flex-none" />
                                                                        </div>
                                                                        <div className="leading-5 w-max">
                                                                            <p className="text-sm font-medium text-foreground shrink-0">
                                                                                {item.label}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground shrink-0 group-hover:text-foreground transition-colors duration-300">
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </li>
                ))}
            </ul>
        </div>
    );
} 