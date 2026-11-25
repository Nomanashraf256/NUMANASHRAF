"""Integration checks with real models and two Chromium microphone fixtures."""
import argparse
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


def run(args):
    with sync_playwright() as p:
        common = ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
        browsers = []
        pages = []
        for fixture in [args.english, args.turkish]:
            browser = p.chromium.launch(executable_path=None if args.chromium == "auto" else args.chromium, args=common + [
                f"--use-file-for-fake-audio-capture={Path(fixture).resolve()}",
            ])
            browsers.append(browser)
            context = browser.new_context(permissions=["microphone", "clipboard-read", "clipboard-write"],
                                          viewport={"width": 390, "height": 844})
            context.add_init_script("""
                SpeechSynthesis.prototype.getVoices = () => [];
                window.played = [];
                window.addEventListener('ended', e => {
                    if (e.target.id === 'spokenAudio') played.push(e.target.duration);
                }, true);
            """)
            page = context.new_page()
            page.on("pageerror", lambda error: print("PAGE ERROR", error))
            page.goto(args.url)
            pages.append(page)
        a, b = pages
        a.locator("#displayName").fill("Creator")
        a.locator("#create").click()
        expect(a.locator("#room")).to_be_visible()
        a.locator("#copy").click()
        expect(a.locator("#notice")).to_have_text("Invite copied.")
        invite = a.evaluate("navigator.clipboard.readText()")
        assert invite == a.url
        b.goto(invite)
        b.locator("#locale").select_option("tr")
        b.locator("#displayName").fill("Guest")
        b.locator("#join button").click()
        expect(a.locator("#presence")).to_contain_text("2 ·")
        expect(b.locator("html")).to_have_attribute("lang", "tr")
        third = browsers[0].new_context().new_page()
        third.goto(invite)
        third.locator("#displayName").fill("Third guest")
        third.locator("#join button").click()
        expect(a.locator("#presence")).to_contain_text("3 ·")
        third.locator("#leave").click()
        expect(a.locator("#presence")).to_contain_text("2 ·")
        third.close()
        print("Room, invite clipboard, three participants, and localization", flush=True)

        draft = a.locator("#draft")
        draft.fill("First line\nSecond line\nThird line\nFourth line")
        expect(a.locator("#typingControls")).to_have_text("Show controls")
        a.set_viewport_size({"width": 390, "height": 360})
        expect(a.locator("#send")).to_be_in_viewport()
        a.locator("#typingControls").click()
        expect(draft).to_have_value("First line\nSecond line\nThird line\nFourth line")
        expect(a.locator("#typingControls")).to_have_text("Return to typing")
        draft.fill("")
        draft.blur()
        a.set_viewport_size({"width": 390, "height": 844})

        for sender, receiver, text, expected in [
            (a, b, "Can you hear me?", "duy"),
            (b, a, "Evet, seni duyabiliyorum.", "hear"),
        ]:
            sender.locator("#draft").fill(text)
            sender.locator("#send").click()
            window = receiver.locator("#messages article").last
            expect(window).to_contain_text(expected, ignore_case=True, timeout=20000)
            expect(window).to_contain_text(text)
            print("Text:", window.inner_text().replace("\n", " | "), flush=True)

        denied = browsers[0].new_context().new_page()
        # A separate room avoids interrupting the bilingual test room.
        denied.goto(args.url)
        denied.locator("#displayName").fill("Browser test")
        denied.locator("#create").click()
        expect(denied.locator("#room")).to_be_visible()
        permissions = denied.context.new_cdp_session(denied)
        context_id = permissions.send("Target.getTargetInfo")["targetInfo"]["browserContextId"]
        root = browsers[0].new_browser_cdp_session()
        root.send("Browser.setPermission", {"permission":{"name":"microphone"}, "setting":"denied",
                                            "origin": args.url.rstrip("/"), "browserContextId":context_id})
        denied.locator("#mic").click()
        expect(denied.locator("#notice")).to_contain_text("denied")
        denied.locator("#leave").click()
        print("Browser microphone permission denial", flush=True)

        for sender, receiver, expected in [(a, b, "duy"), (b, a, "hear")]:
            sender.locator("#mic").click()
            expect(sender.locator("#recordStatus")).not_to_be_empty()
            sender.wait_for_timeout(3800)
            sender.locator("#mic").click()
            window = receiver.locator("#messages article").last
            expect(window).to_contain_text(expected, ignore_case=True, timeout=30000)
            window.get_by_role("button", name="Open attachment" if receiver is a else "Eki aç").click()
            expect(window.locator("audio")).to_have_count(1, timeout=30000)
            assert window.locator("audio").evaluate("async el => { await el.play(); return !el.paused }")
            window.locator("audio").evaluate("el => el.pause()")
            window.get_by_role("button", name="Play translation" if receiver is a else "Çeviriyi dinle").click()
            receiver.wait_for_function("played.length >= 1 && played.every(n => n > 0)", timeout=20000)
            print("Voice:", window.inner_text().replace("\n", " | "), flush=True)

        a.locator("#call").click()
        b.locator("#decline").click()
        expect(a.locator("#notice")).to_contain_text("declined")
        a.locator("#call").click()
        b.locator("#accept").click()
        for page in pages:
            page.wait_for_function("document.querySelector('#peerAudio').srcObject?.getAudioTracks().length === 1", timeout=25000)
        expect(a.locator("#callNotice")).to_contain_text("Listening", timeout=25000)
        expect(b.locator("#callNotice")).to_contain_text("bekleniyor", timeout=25000)
        for page in pages:
            page.wait_for_function("document.querySelector('#captions button')", timeout=35000)
            page.wait_for_function("played.length >= 2", timeout=35000)
        print("Automatic WebRTC calls, translated captions and queued fallback playback", flush=True)
        print("English call captions:", a.locator("#captions").inner_text(), flush=True)
        print("Turkish call captions:", b.locator("#captions").inner_text(), flush=True)

        a.locator("#hear").select_option("original")
        assert a.locator("#peerAudio").evaluate("el => !el.muted")
        a.locator("#hear").select_option("both")
        assert a.locator("#peerAudio").evaluate("el => !el.muted")
        a.locator("#hear").select_option("translated")
        assert a.locator("#peerAudio").evaluate("el => el.muted")
        a.locator("#mute").click()
        expect(a.locator("#mute")).to_have_text("Unmute")
        a.locator("#mute").click()
        a.locator("#capture").select_option("push")
        b.locator("#capture").select_option("push")
        count = b.locator("#captions button").count()
        a.locator("#phrase").click()
        expect(a.locator("#phrase")).to_have_text("Finish phrase")
        a.wait_for_timeout(6200)
        a.locator("#phrase").click()
        expect(b.locator("#captions button")).to_have_count(count+1, timeout=30000)
        print("Mute, three audio modes and manual push-to-talk", flush=True)

        a.context.set_offline(True)
        expect(b.locator("#presence")).to_contain_text("1 ·", timeout=24000)
        a.context.set_offline(False)
        expect(a.locator("#presence")).to_contain_text("2 ·", timeout=25000)
        expect(b.locator("#presence")).to_contain_text("2 ·", timeout=25000)
        for page in pages:
            page.wait_for_function("document.querySelector('#peerAudio').srcObject?.getAudioTracks().length === 1", timeout=25000)
        expect(a.locator("#callNotice")).to_have_text("", timeout=25000)
        a.locator("#end").click()
        expect(b.locator("#callPanel")).to_be_hidden()
        b.locator("#leave").click()
        expect(a.locator("#presence")).to_contain_text("1 ·")
        print("Call reconnection, end and leave", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8080")
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    parser.add_argument("--english", required=True)
    parser.add_argument("--turkish", required=True)
    run(parser.parse_args())
