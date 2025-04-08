# MangaReaderV2: The Proper Job

Listen up, you lot. This ain't your granddad's manga reader. This is MangaReaderV2 - a proper piece of kit that'll work on whatever fancy rectangle you're holding - iOS, Android, or that web browser you're so fond of.

## The Gear (Tech Stack)

We're rocking with:
- **Expo & React Native** - The backbone, innit? Cross-platform muscle without the faff.
- **Expo Router** - File-based routing. Sharp as a tack, this one.
- **Zustand** - State management that doesn't make you want to headbutt a wall.
- **Axios** - For chatting with your Kavita API without breaking a sweat.
- **SecureStore** - Keeps your tokens locked up tighter than a drum.
- **Reanimated** - Makes things move smooth as butter on a hot day.
- **shadcn/ui & Tailwind CSS** - For making it pretty without crying into your keyboard.

## The Journey (Screen Flow)

1. **Server Connection** - Your first port of call. No connection, no party.
2. **Library** - The grand tour of your collection. Neat little grid of manga covers.
3. **Series Detail** - All the nitty-gritty about your chosen manga.
4. **Reader** - Where the magic happens. Flip through pages like you're thumbing through cash.
5. **Settings** - Tweak it to your liking. We ain't judging.

---

## The State of Affairs

Right, so you want to know how this bad boy is structured? We've got the full blueprint laid out - components, routing, theming - the whole nine yards.

👉 [Check the State File](./theState.md) if you fancy a proper look under the hood.

## The Masterplan

Now, don't go thinking we're making this up as we go. We've got a plan sharper than a razor. Authentication, API setup, state management - it's all mapped out like a proper heist.

👉 [Get your eyes on The Plan](./thePlan.md) to see how this beauty comes together.

---

## Getting This Show on the Road

1. Install the dependencies (the crew for our job):

   ```bash
   npm install
   ```

2. Fire up the engine:

   ```bash
   npx expo start
   ```

Now pick your poison:
- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

Start tinkering in the **app** directory. File-based routing means what it says on the tin.

## Fresh Start

Want to wipe the slate?

```bash
npm run reset-project
```

---

*"Proper preparation prevents poor performance."* - Some wise guy who knew what they were talking about.
