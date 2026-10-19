const checkRole = (...roles) => {
    // FIXED: Flatten any nested arrays to handle both formats:
    // checkRole('admin', 'owner') OR checkRole(['admin', 'owner'])
    let requiredRoles = roles.flat();
    
    return (req, res, next) => {
        
        
        
        
        if (!req.user) {
            console.error('CheckRole: No user object in request');
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized - no user' 
            });
        }
        
        // Ensure user roles is always an array
        const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles].filter(Boolean);
        
        
        
        
        // Check if user has at least one of the required roles
        const hasRole = userRoles.some(role => requiredRoles.includes(role));
        
        if (!hasRole) {
            console.error('CheckRole: User does not have required role');
            console.error('User has:', userRoles);
            console.error('Needs one of:', requiredRoles);
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to perform this action',
                required: requiredRoles,
                userRoles: userRoles
            });
        }
        
        
        next();
    };
};

module.exports = { checkRole };
