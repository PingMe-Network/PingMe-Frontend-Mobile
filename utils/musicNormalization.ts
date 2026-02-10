import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";

export function normalizeTopSong(item: TopSongPlayCounter | SongResponseWithAllAlbum): SongResponseWithAllAlbum {
    if ('songId' in item) {
        // It's a TopSongPlayCounter
        return {
            id: item.songId,
            title: item.title,
            duration: item.duration || 0,
            playCount: item.playCount,
            songUrl: item.songUrl || '',
            coverImageUrl: item.imgUrl || '',
            mainArtist: {
                id: 0,
                name: item.artist || 'Unknown Artist',
                role: 'MAIN_ARTIST',
                imgUrl: ''
            },
            otherArtists: [],
            genres: [],
            albums: [],
        } as unknown as SongResponseWithAllAlbum;
    }
    // It's already fully fledged song
    return item;
}
