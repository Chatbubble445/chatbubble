export const isOwner = (req: any, res: any, next: any) => {
    const { username } = req.body;
    if (username === 'Lord_lucifer') {
        next();
    } else {
        res.status(403).json({ error: "Access Denied: Sirf Owner hi ye kar sakta hai!" });
    }
};
