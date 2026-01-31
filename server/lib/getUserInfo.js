function getUserInfo(user) {
    return {
        username: user.username,
        name: user.name,
        id: user.id || user._id, // ⬜ MongoDB usa _id, no id
    };
}

module.exports =    {getUserInfo};