"use client"
import React, { useContext, useEffect } from 'react'
import { connect } from 'react-redux';
import { ThemeChanger } from '@/shared/redux/action';
import { Initialload } from '@/shared/contextapi';
import store from '@/shared/redux/store';

const DARK_THEME = {
  class: "dark",
  dataHeaderStyles: "dark",
  dataMenuStyles: "dark",
  colorPrimary: "232 118 108",
  colorPrimaryRgb: "232, 118, 108",
  bodyBg: "",
  darkBg: "",
  inputBorder: "",
  Light: "",
} as const;

function Layout({children, local_varaiable, ThemeChanger}:any) {
  const customstyles :any= {
    ...(local_varaiable.colorPrimaryRgb !== '' && { '--primary-rgb': local_varaiable.colorPrimaryRgb }),
    ...(local_varaiable.colorPrimary !== '' && { '--primary': local_varaiable.colorPrimary }),
    ...(local_varaiable.darkBg !== '' && { '--dark-bg': local_varaiable.darkBg }),
    ...(local_varaiable.bodyBg !== '' && { '--body-bg': local_varaiable.bodyBg }),
    ...(local_varaiable.inputBorder !== '' && { '--input-border': local_varaiable.inputBorder }),
    ...(local_varaiable.Light !== '' && { '--light': local_varaiable.Light }),
  };

  const theme :any= useContext(Initialload);


  useEffect(() => {
    if (typeof window === 'undefined' || theme.pageloading) return;

    localStorage.removeItem('ynexlighttheme');
    localStorage.removeItem('bodyBgRGB');
    localStorage.removeItem('primaryRGB');
    localStorage.removeItem('dynamiccolor');
    localStorage.setItem('ynexdarktheme', 'dark');

    ThemeChanger({
      ...store.getState(),
      ...DARK_THEME,
    });
    theme.setpageloading(true);
  }, []);

  return (
    <>
         <html
            suppressHydrationWarning={true} 
            dir={local_varaiable.dir}
            className={local_varaiable.class}
            data-header-styles={local_varaiable.dataHeaderStyles}
            data-vertical-style={local_varaiable.dataVerticalStyle}
            data-nav-layout={local_varaiable.dataNavLayout}
            data-menu-styles={local_varaiable.dataMenuStyles}
            data-toggled={local_varaiable.dataToggled}
            data-nav-style={local_varaiable.dataNavStyle}
            hor-style={local_varaiable.horStyle}
            data-page-style={local_varaiable.dataPageStyle}
            data-width={local_varaiable.dataWidth}
            data-menu-position={local_varaiable.dataMenuPosition}
            data-header-position={local_varaiable.dataHeaderPosition}
            data-icon-overlay={local_varaiable.iconOverlay}
            bg-img={local_varaiable.bgImg}
            data-icon-text={local_varaiable.iconText}

            //Styles
            style={customstyles}>
              <head>
              <link rel="icon" href="/assets/images/brand-logos/religence-icon.png" type="image/png" />
              <meta name="description" content="Religence CRM — pharmaceutical lead discovery, pipeline management, and email outreach." />
              <meta name="keywords" content="Religence, pharma CRM, lead discovery, API salts, active leads, email templates" />
              </head>
             <body
              suppressHydrationWarning
              className={local_varaiable.body || ''}
            >
              {theme.pageloading && children}
             </body>
          </html>
    </>
  )
}

const mapStateToProps = (state: any) => ({
  local_varaiable: state
});

const ConnectedLayout = connect(mapStateToProps, {ThemeChanger})(Layout);

// Next's App Router requires the default export to accept only `children`;
// a connect()-wrapped component exposes extra props and fails that contract.
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <ConnectedLayout>{children}</ConnectedLayout>;
}