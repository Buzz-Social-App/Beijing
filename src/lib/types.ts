export interface Event {
    id: string;
    name: string;
    host: {
        id: string;
        username: string;
    };
    created_at: string;
    location: string | null;
    city: string;
    description: string;
    date: string;
    start_time: string;
    cta_link: string | null;
    price: number | null;
    latitude: number | null;
    longitude: number | null;
    hero_image: string | null;
    supporting_images: string[] | null;
    status: string;
    profiles: {
        username: string;
    };
    // tags: {
    //     tag: {
    //         title: string;
    //         icon: string;
    //     };
    // }[];
}