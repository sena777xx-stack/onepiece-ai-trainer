/* v3999: keep the Teach leader redirect flow usable on narrow mobile screens. */
const style3999 = document.createElement('style');
style3999.textContent = `
.dialog .redirect-flow {
  width: min(calc(100vw - 28px), 560px) !important;
  max-width: 560px !important;
  max-height: min(88dvh, 820px) !important;
  box-sizing: border-box !important;
  display: grid !important;
  grid-template-rows: auto minmax(0, 1fr) auto !important;
  overflow: hidden !important;
}
.dialog .redirect-head {
  min-width: 0 !important;
}
.dialog .redirect-head h2 {
  font-size: clamp(24px, 7vw, 34px) !important;
  line-height: 1.2 !important;
  overflow-wrap: anywhere !important;
}
.dialog .redirect-body {
  min-width: 0 !important;
  min-height: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
  -webkit-overflow-scrolling: touch !important;
}
.dialog .redirect-flow img {
  display: block !important;
  width: auto !important;
  max-width: min(150px, 100%) !important;
  max-height: 210px !important;
  object-fit: contain !important;
  margin-inline: auto !important;
}
.dialog .redirect-body .effect-target-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 10px !important;
  width: 100% !important;
}
.dialog .redirect-body .effect-target-grid > button {
  min-width: 0 !important;
  width: 100% !important;
  overflow: hidden !important;
  padding: 8px !important;
}
.dialog .redirect-body .effect-target-grid > button img {
  width: 100% !important;
  max-width: 150px !important;
  height: auto !important;
  aspect-ratio: 5 / 7 !important;
}
.dialog .redirect-body .effect-target-grid strong,
.dialog .redirect-body .effect-target-grid small {
  display: block !important;
  max-width: 100% !important;
  overflow-wrap: anywhere !important;
}
.dialog .redirect-footer {
  position: relative !important;
  min-width: 0 !important;
  padding-top: 10px !important;
  background: inherit !important;
}
.dialog .redirect-footer button {
  min-width: 0 !important;
  min-height: 52px !important;
}
@media (max-width: 390px) {
  .dialog .redirect-flow {
    width: calc(100vw - 20px) !important;
    max-height: 86dvh !important;
  }
  .dialog .redirect-body .effect-target-grid {
    gap: 8px !important;
  }
  .dialog .redirect-flow img {
    max-height: 180px !important;
  }
}
`;
document.head.append(style3999);
