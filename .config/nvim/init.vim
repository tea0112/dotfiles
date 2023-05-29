set number
set nohlsearch
set tabstop=4 shiftwidth=4 expandtab

colorscheme retrobox

let mapleader=" "

"""""""""""""""""""
" normal mode map "
"""""""""""""""""""
map <leader>sv :source $MYVIMRC<CR>
map <C-n> :Explore<CR>

" Find files using Telescope command-line sugar.
nnoremap <leader>ff <cmd>Telescope find_files<cr>
nnoremap <leader>fg <cmd>Telescope live_grep<cr>
nnoremap <leader>fb <cmd>Telescope buffers<cr>
nnoremap <leader>fh <cmd>Telescope help_tags<cr>

imap jk <Esc>
imap <C-n> :Explore<CR>

lua << EOF
    require("init")
EOF
