import type { SongResponseWithAllAlbum, TopSongPlayCounter } from "@/types/music";

export function normalizeTopSong(item: TopSongPlayCounter | SongResponseWithAllAlbum): SongResponseWithAllAlbum {
    if ('songId' in item) {
        const topSong = item as TopSongPlayCounter;
        // It's a TopSongPlayCounter - Map to SongResponseWithAllAlbum structure
        return {
            id: topSong.songId,
            title: topSong.title,
            duration: topSong.duration || 0,
            playCount: topSong.playCount,
            songUrl: topSong.songUrl || '',
            coverImageUrl: topSong.imgUrl || '',
            mainArtist: {
                id: 0,
                name: topSong.artist || 'Unknown Artist',
                role: 'MAIN_ARTIST',
                imgUrl: ''
            },
            otherArtists: [],
            genres: [],
            albums: [],
        } as unknown as SongResponseWithAllAlbum;
    }
    // It's already a full song object
    return item;
}
