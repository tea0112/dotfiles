# move a window to a session

- The name of the session you want to move the window from (for future reference, $session_name)
- The index of the window you want to move (in the session it's currently in, of course -- we'll call this $window_index). This is actually optional -- if you omit this, then it defaults to the window in focus in the session you're pulling the window from.
- The $window_index is optional (as indicated by the square brackets, which aren't actually part of the syntax ).
- From this point, you can just change to the session you want to move the window into, press prefix key, open a command prompt, and type a command of this form:
```
move-window -s $session_name[:$window_index]
```
- Moves from currently-focused window from session named `$session_name`
```
move-window -s $session_name
```
- Moves from window with index `$window_index` from session named `$session_name` into the current session
```
move-window -s $session_name:$window_index
```
