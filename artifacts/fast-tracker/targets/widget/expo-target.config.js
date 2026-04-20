/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  icon: "../../assets/images/icon.png",
  colors: {
    $accent: "#a29bfe",
    $widgetBackground: "#1a0f2e",
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.com.altfast.shared"],
  },
};
