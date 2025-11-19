-- DualSubManager - Easier management of secondary subtitles in mpv
-- Save this file to your mpv/scripts/ folder (e.g., %APPDATA%/mpv/scripts/ on Windows or ~/.config/mpv/scripts/ on Linux/macOS)

local mp = require 'mp'
local msg = require 'mp.msg'

-- Keep track of the last used secondary sid to restore it when toggling on
local last_secondary_sid = nil

function get_subtitle_tracks()
    local tracks = mp.get_property_native("track-list")
    local subs = {}
    for _, track in ipairs(tracks) do
        if track.type == "sub" then
            table.insert(subs, track)
        end
    end
    return subs
end

function show_osd(text)
    mp.osd_message(text, 3)
end

function toggle_secondary()
    local current_secondary = mp.get_property_number("secondary-sid") or 0
    
    if current_secondary > 0 then
        -- Currently on, turn it off and save state
        last_secondary_sid = current_secondary
        mp.set_property_number("secondary-sid", 0)
        show_osd("Secondary Subtitles: Off")
    else
        -- Currently off, try to restore or pick the first available
        if last_secondary_sid and last_secondary_sid > 0 then
            mp.set_property_number("secondary-sid", last_secondary_sid)
        else
            -- If no memory, try to find a track that isn't the primary one
            cycle_secondary_track() 
            return -- cycle function handles the OSD
        end
        
        -- Check what we actually got
        local new_sid = mp.get_property_number("secondary-sid") or 0
        if new_sid > 0 then
            show_osd("Secondary Subtitles: On")
        else
            show_osd("No Secondary Subtitles available")
        end
    end
end

function cycle_secondary_track()
    local subs = get_subtitle_tracks()
    if #subs == 0 then
        show_osd("No subtitle tracks found")
        return
    end

    local current_primary = mp.get_property_number("sid") or 0
    local current_secondary = mp.get_property_number("secondary-sid") or 0
    
    -- Find current index in our clean list
    local current_index = 0
    for i, track in ipairs(subs) do
        if track.id == current_secondary then
            current_index = i
            break
        end
    end

    -- Find next suitable track
    local found_next = false
    local attempt_index = current_index
    local loop_count = 0
    
    -- Loop until we find a valid track or exhaust options
    while not found_next and loop_count <= #subs do
        attempt_index = attempt_index + 1
        if attempt_index > #subs then attempt_index = 1 end
        
        local candidate = subs[attempt_index]
        
        -- Logic: 
        -- 1. Must not be the current primary track (unless it's the only one)
        -- 2. We want to cycle, so we just pick the next one in the list
        if candidate.id ~= current_primary or #subs == 1 then
            mp.set_property_number("secondary-sid", candidate.id)
            last_secondary_sid = candidate.id
            
            local lang = candidate.lang or "unknown"
            local title = candidate.title or "Track " .. candidate.id
            show_osd("Secondary: " .. title .. " (" .. lang .. ")")
            found_next = true
        end
        loop_count = loop_count + 1
    end

    if not found_next then
        -- If we couldn't find a different one, maybe just disable it?
        -- Or if we are here, it means we only have 1 track and it's primary.
        mp.set_property_number("secondary-sid", 0)
        show_osd("Secondary: None")
    end
end

-- Register key bindings
-- You can override these in your input.conf using script-binding
mp.add_key_binding("k", "cycle_secondary_subs", cycle_secondary_track)
mp.add_key_binding("K", "toggle_secondary_subs", toggle_secondary)

msg.info("DualSubManager loaded.")
