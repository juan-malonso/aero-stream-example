"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, type CSSProperties } from "react";
import { colors, typography } from "@/styles/tokens";
import { Row } from "@/components/ui";
import {
  getMicrofrontendTheme,
  MICROFRONTEND_THEMES,
  type MicrofrontendTheme,
} from "@/styles/microfrontends";

interface NavItemProps {
  theme: MicrofrontendTheme;
  current: MicrofrontendTheme;
  isActive: boolean;
}

function SurfaceIcon({
  icon,
  color,
  size = 20,
}: {
  icon: MicrofrontendTheme["icon"];
  color: string;
  size?: number;
}) {
  if (icon === "puzzle") {
    return (
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="1 1 22 22"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.1206 1.02129C12.109 1.0067 12.9592 1.54344 13.7096 2.29199L13.7104 2.29285L14.9707 3.5531C15.1118 3.34249 15.2753 3.14257 15.461 2.95679C17.0025 1.4153 19.5018 1.4153 21.0433 2.9568C22.5848 4.49829 22.5848 6.99754 21.0433 8.53904C20.8575 8.72481 20.6576 8.88828 20.447 9.02939L21.7072 10.2896L21.708 10.2905C22.4565 11.0408 22.9932 11.891 22.9787 12.8794C22.9642 13.8602 22.41 14.6797 21.7058 15.3789C21.7054 15.3793 21.7049 15.3798 21.7045 15.3802L20.4287 16.656C19.9519 17.1327 19.3279 17.0824 18.9512 16.9234C18.5783 16.7659 18.1803 16.4041 18.0897 15.8508C18.0262 15.4628 17.8456 15.0914 17.5452 14.791C16.7847 14.0306 15.5518 14.0306 14.7914 14.791C14.0309 15.5515 14.0309 16.7844 14.7914 17.5448C15.0917 17.8452 15.4631 18.0259 15.8511 18.0894C16.4044 18.18 16.7663 18.5779 16.9237 18.9509C17.0827 19.3276 17.1331 19.9516 16.6564 20.4283L15.377 21.7077C15.3766 21.7081 15.3762 21.7085 15.3757 21.709C14.6777 22.412 13.8591 22.965 12.8794 22.9795C11.8922 22.994 11.0429 22.4585 10.2938 21.7112L10.2929 21.7103L9.0295 20.4469C8.88841 20.6575 8.72496 20.8573 8.53922 21.0431C6.99773 22.5846 4.49847 22.5846 2.95698 21.0431C1.41549 19.5016 1.41549 17.0023 2.95698 15.4608C3.14272 15.2751 3.3426 15.1116 3.55317 14.9706L2.29294 13.7103L2.29208 13.7095C1.54353 12.9591 1.00681 12.1089 1.02141 11.1205C1.03589 10.1397 1.59009 9.32029 2.29424 8.62107C2.29469 8.62062 2.29515 8.62017 2.2956 8.61972L3.57165 7.34366C4.0484 6.86691 4.67249 6.9173 5.04916 7.07633C5.4221 7.23378 5.82003 7.59563 5.91062 8.14898C5.97414 8.53701 6.15479 8.90842 6.45519 9.20882C7.21563 9.96926 8.44856 9.96926 9.209 9.20882C9.96945 8.44837 9.96945 7.21545 9.20901 6.455C8.90861 6.1546 8.53719 5.97396 8.14917 5.91043C7.59581 5.81984 7.23397 5.42191 7.07652 5.04897C6.91749 4.6723 6.86709 4.04821 7.34384 3.57146L8.61978 2.29553C8.62025 2.29506 8.62071 2.29459 8.62118 2.29413C9.32039 1.58996 10.1398 1.03576 11.1206 1.02129ZM11.1501 3.02107C10.9456 3.02409 10.6003 3.13919 10.0393 3.70438L10.0367 3.70706L9.49334 4.25039C9.90279 4.44025 10.2863 4.70387 10.6232 5.04079C12.1647 6.58228 12.1647 9.08154 10.6232 10.623C9.08173 12.1645 6.58247 12.1645 5.04098 10.623C4.70406 10.2861 4.44044 9.9026 4.25058 9.49315L3.70715 10.0366L3.70449 10.0392C3.13933 10.6002 3.02421 10.9455 3.02119 11.1501C3.01827 11.3476 3.11651 11.7039 3.70773 12.2967L6.03813 14.6271C6.30605 14.895 6.39954 15.2913 6.2796 15.6508C6.15966 16.0102 5.8469 16.2709 5.47177 16.3243C5.06894 16.3815 4.68196 16.5643 4.37119 16.8751C3.61075 17.6355 3.61075 18.8684 4.3712 19.6289C5.13164 20.3893 6.36456 20.3893 7.12501 19.6289C7.43577 19.3181 7.61854 18.9311 7.67581 18.5283C7.72914 18.1532 7.9899 17.8404 8.34931 17.7205C8.70872 17.6005 9.10505 17.694 9.37296 17.9619L11.7072 20.2961C12.2975 20.8848 12.6529 20.9826 12.8499 20.9797C13.0539 20.9767 13.3986 20.8619 13.9575 20.2988L13.9601 20.2961L14.5069 19.7494C14.0975 19.5595 13.714 19.2959 13.3772 18.9591C11.8357 17.4176 11.8357 14.9183 13.3772 13.3768C14.9186 11.8353 17.4179 11.8353 18.9594 13.3768C19.2963 13.7137 19.5599 14.0972 19.7497 14.5065L20.2929 13.9633L20.2956 13.9607C20.8608 13.3998 20.9759 13.0544 20.9789 12.8499C20.9818 12.6524 20.8836 12.2961 20.2928 11.7036L17.9619 9.3728C17.694 9.10487 17.6005 8.70853 17.7205 8.34912C17.8404 7.9897 18.1532 7.72895 18.5284 7.67564C18.9312 7.61839 19.3183 7.43561 19.6291 7.12482C20.3895 6.36438 20.3895 5.13145 19.6291 4.37101C18.8686 3.61056 17.6357 3.61056 16.8752 4.37101C16.5644 4.6818 16.3817 5.06882 16.3244 5.4717C16.2711 5.84683 16.0104 6.15962 15.6509 6.27957C15.2915 6.39953 14.8952 6.30604 14.6273 6.03812L12.2971 3.70792C11.704 3.11638 11.3476 3.01815 11.1501 3.02107Z"
          fill={color}
        />
      </svg>
    );
  }

  if (icon === "play") {
    return (
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="1 1 22 22"
        fill="none"
      >
        <path
          fillRule="evenodd"
          d="M12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23ZM12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM8 17V7C8 6.21456 8.86395 5.73572 9.53 6.152L17.53 11.152C18.1567 11.5437 18.1567 12.4563 17.53 12.848L9.53 17.848C8.86395 18.2643 8 17.7854 8 17ZM15.1132 12L10 8.80425V15.1958L15.1132 12Z"
          fill={color}
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 5.67541V3C3 2.44772 2.55228 2 2 2C1.44772 2 1 2.44772 1 3V7C1 8.10457 1.89543 9 3 9H7C7.55229 9 8 8.55229 8 8C8 7.44772 7.55229 7 7 7H4.52186C4.54218 6.97505 4.56157 6.94914 4.57995 6.92229C5.621 5.40094 7.11009 4.22911 8.85191 3.57803C10.9074 2.80968 13.173 2.8196 15.2217 3.6059C17.2704 4.3922 18.9608 5.90061 19.9745 7.8469C20.9881 9.79319 21.2549 12.043 20.7247 14.1724C20.1945 16.3018 18.9039 18.1638 17.0959 19.4075C15.288 20.6513 13.0876 21.1909 10.9094 20.9247C8.73119 20.6586 6.72551 19.605 5.27028 17.9625C4.03713 16.5706 3.27139 14.8374 3.06527 13.0055C3.00352 12.4566 2.55674 12.0079 2.00446 12.0084C1.45217 12.0088 0.995668 12.4579 1.04626 13.0078C1.25994 15.3309 2.2082 17.5356 3.76666 19.2946C5.54703 21.3041 8.00084 22.5931 10.6657 22.9188C13.3306 23.2444 16.0226 22.5842 18.2345 21.0626C20.4464 19.541 22.0254 17.263 22.6741 14.6578C23.3228 12.0526 22.9963 9.30013 21.7562 6.91897C20.5161 4.53782 18.448 2.69239 15.9415 1.73041C13.4351 0.768419 10.6633 0.756291 8.14853 1.69631C6.06062 2.47676 4.26953 3.86881 3 5.67541Z"
        fill={color}
      />
      <path
        d="M12 5C11.4477 5 11 5.44771 11 6V12.4667C11 12.4667 11 12.7274 11.1267 12.9235C11.2115 13.0898 11.3437 13.2344 11.5174 13.3346L16.1372 16.0019C16.6155 16.278 17.2271 16.1141 17.5032 15.6358C17.7793 15.1575 17.6155 14.546 17.1372 14.2698L13 11.8812V6C13 5.44772 12.5523 5 12 5Z"
        fill={color}
      />
    </svg>
  );
}

function NavItem({ theme, current, isActive }: NavItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const activeColor = current.primary700;
  const iconColor = isActive
    ? activeColor
    : isHovered
      ? current.primary500
      : colors.gray500;
  const interactionColor = isActive
    ? activeColor
    : isHovered
      ? current.primary600
      : colors.gray500;

  const navItemStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0 1.25rem",
    width: "190px",
    height: "100%",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
    color: interactionColor,
    transition: "all 0.2s ease",
    backgroundColor: isActive
      ? current.primary100
      : isHovered
        ? current.primary50
        : "transparent",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    outline: "none",
    textDecoration: "none",
  };

  return (
    <Link
      href={theme.href}
      style={navItemStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        style={{
          width: "28px",
          height: "28px",
          flex: "0 0 32px",
          minWidth: "32px",
          minHeight: "32px",
          borderRadius: "8px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: isActive
            ? current.primary100
            : isHovered
              ? current.primary50
              : "transparent",
          border: `1px solid ${isActive || isHovered ? current.primary200 : colors.gray200}`,
        }}
      >
        <SurfaceIcon icon={theme.icon} color={iconColor} />
      </span>
      {theme.label}
    </Link>
  );
}

export function Header() {
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();
  const activeTheme = getMicrofrontendTheme(pathname);

  React.useEffect(() => {
    // Force dark mode on mount
    document.body.classList.add("dark");
  }, []);

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    height: "4rem",
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.white,
    position: "sticky",
    top: 0,
    zIndex: 50,
  };

  const titleStyle: CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: "1.5rem",
    fontWeight: 600,
    color: colors.gray800,
    marginRight: "2rem",
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  return (
    <header style={headerStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: "4rem",
        }}
      >
        <h1
          style={{
            ...titleStyle,
            letterSpacing: "-0.025em",
            display: "flex",
            gap: "0.4rem",
            alignItems: "center",
            margin: 0,
          }}
        >
          <div style={{ color: activeTheme.primary500, fontWeight: 800 }}>
            Aero
          </div>
          <div style={{ color: colors.gray600, fontWeight: 300 }}>Stream</div>
        </h1>

        <nav
          style={{
            display: "flex",
            height: "100%",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {MICROFRONTEND_THEMES.map((theme) => (
            <NavItem
              key={theme.key}
              theme={theme}
              current={activeTheme}
              isActive={pathname === theme.href}
            />
          ))}
        </nav>
      </div>
      <Row gap="0.75rem" align="center">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.45rem 0.65rem",
            border: `1px solid ${activeTheme.primary200}`,
            borderRadius: "8px",
            background: activeTheme.primary50,
            color: activeTheme.primary700,
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.semibold,
          }}
        >
          <SurfaceIcon
            icon={activeTheme.icon}
            color={activeTheme.primary600}
            size={16}
          />
          {activeTheme.shortLabel}
        </div>
        <button
          onClick={toggleTheme}
          style={{
            padding: "0.4rem 1rem",
            border: `1px solid ${colors.gray300}`,
            backgroundColor: "transparent",
            color: colors.gray700,
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray100;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {isDark ? "Light Theme" : "Dark Theme"}
        </button>
      </Row>
    </header>
  );
}
