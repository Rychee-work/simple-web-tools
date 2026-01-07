// AdSenseの「共通コード（ca-pub-）」は、審査通過後に <head> に入れるのが基本。
// Auto Adsを使うなら head の1行だけでOK。
// 手動枠を使う場合は、ページ内にある <ins class="adsbygoogle"> に対して push される必要があります。

window.renderAds = function renderAds() {
  // 審査前は何もしない（安全）
  // 承認後： (adsbygoogle = window.adsbygoogle || []).push({});
};
